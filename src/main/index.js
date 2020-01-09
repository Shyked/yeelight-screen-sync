'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
  const window = new BrowserWindow({webPreferences: {nodeIntegration: true}})

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
  startYeelight();
});


var startYeelight = function() {

  const Lookup = require("node-yeelight-wifi").Lookup;
  const screenshot = require('screenshot-desktop');
  const PNG = require('pngjs').PNG;
  const Readable = require('stream').Readable;
  const imageDataURI = require('image-data-uri');
  const Vibrant = require('node-vibrant');
  const ip = require('ip');

  var lights = [];
  var currentDominant = null;
  var lastUpdate = new Date().getTime();
  var lastsTurnOff = [];

  ipcMain.on('dominant-color', (event, dominant) => {
    let diff = null;
    if (currentDominant) {
      diff =  Math.abs(dominant.color[0] - currentDominant.color[0])
              + Math.abs(dominant.color[1] - currentDominant.color[1])
              + Math.abs(dominant.color[2] - currentDominant.color[2])
              + Math.abs(dominant.light - currentDominant.light);
    }

    let currentTime = new Date().getTime();
    let elapsedTime = (currentTime - lastUpdate) / 30;
    // console.log(diff + elapsedTime);

    if (diff + elapsedTime > 50 || !currentDominant) {
      lights.forEach(light => {
        let duration = Math.max(1000 - diff * 10, 300);

        // Compute number of power off during the last minute
        let first;
        let now = new Date().getTime();
        while (first = lastsTurnOff[0]) {
          if (now - first > 60000) lastsTurnOff.shift();
          else break;
        }
        let powerOffRate = lastsTurnOff.length;

        if (dominant.light <= 1 && light.power && powerOffRate < 14) {
          lastsTurnOff.push(new Date().getTime());
          light.setPower(false, duration);
        }
        else if (dominant.light > 1) {
          if (!light.power) {
            light.setPower(true, duration);
            connectToTcpServer(light);
            light.setRGB(dominant.color, duration);
          }
          else {
            if (light.music) {
              light.music.setRGB(dominant.color, duration);
              light.music.setBright(dominant.light, duration);
            }
          }
        }
        // console.log(light.power);
      });
      currentDominant = dominant;
      lastUpdate = currentTime;
    }
    // console.log(dominant);
  });

  var ok = false;

  console.log('Looking for Yeelight...');
  let look = new Lookup();

  look.on("detected", light => {
    ok = true;
    lights.push(light);
    console.log("New yeelight detected: id=" + light.id + " name=" + light.name);

    if (!light.power) {
      light.setPower(true);
    }

    connectToTcpServer(light);
  });

  var interval = setInterval(() => {
    if (!ok) {
      look.lookup();
    }
    else {
      clearInterval(interval);
    }
  }, 5000);


  let tcpServerStarted = false;

  var connectToTcpServer = function(light) {
    return new Promise((resolve, reject) => {
      if (!tcpServerStarted) {
        tcpServerStarted = true;
        var net = require('net');

        var server = net.createServer(function(socket) {
          console.log('Light connected to TCP server');
          let control = {
            setRGB: function(rgb, duration) {
              let color = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
              let params = {
                id: 1,
                method: 'set_rgb',
                params: [color, (duration == 0 ? 'sudden' : 'smooth'), duration]
              };
              socket.write(JSON.stringify(params) + '\r\n');
            },
            setBright: function(bright, duration) {
              let params = {
                id: 1,
                method: 'set_bright',
                params: [bright, (duration == 0 ? 'sudden' : 'smooth'), duration]
              };
              socket.write(JSON.stringify(params) + '\r\n');
            },
            setPower: function(power, duration) {
              let params = {
                id: 1,
                method: 'set_power',
                params: [power, (duration == 0 ? 'sudden' : 'smooth'), duration]
              };
              socket.write(JSON.stringify(params) + '\r\n');
            }
          };
          light.music = control;

          socket.on('close', () => {
            console.log('SOCKET LOST');
            light.music = null;
          });
        });

        server.on('error', (e) => {
          console.error(e.code);
        });

        server.listen(54321);

      }
      let host = findIpInNetwork(light.host);

      light.sendCommand("set_music", [1, host, 54321]).catch(e => {
        console.error(e);
      });
    });
  };

  var findIpInNetwork = function(remoteIp) {
    const os = require('os');
    const ifaces = os.networkInterfaces();

    let cidrs = [];
    let host = null;

    Object.keys(ifaces).forEach(function (ifname) {
      ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) return;
        cidrs.push(iface.cidr);
      });
    });

    cidrs.forEach(cidr => {
      if (ip.cidrSubnet(cidr).contains(remoteIp)) {
        host = cidr.split('/')[0];
      }
    });

    if (!host) throw "Can't find shared network";

    return host;
  };


};
