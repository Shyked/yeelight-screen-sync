
import { ipcMain as IpcMain } from 'electron'
import { Lookup } from 'node-yeelight-wifi'
import Ip from 'ip'
import FindFreePort from 'find-free-port'
import Net from 'net'
import Os from 'os'

import MusicMode from './MusicMode'
import EventHandler from '../EventHandler.js'

class YeelightController extends EventHandler {

  constructor () {
    super();

    this.lights = [];
    this.currentDominant = null;
    this.lastUpdate = new Date().getTime();
    this.lastsTurnOff = [];
    this.server = null;
    this.port = null;

    this._initEvents();

    this._startServer().then(() => {
      this.lookup();
    }).catch(err => {
      console.error(err);
    });
  }

  _initEvents () {
    IpcMain.on('dominant-color', (event, dominant) => {
      this._handleColor(dominant);
    });
  }

  _startServer () {
    return new Promise((resolve, reject) => {
      this.server = Net.createServer((socket) => {
        let address = socket.remoteAddress.match(/[^:]+$/)[0];
        let light = this.findLightWithHost(address);
        if (light) {
          light.musicMode = new MusicMode(socket);
          socket.on('close', hadError => {
            light.musicMode = null;
            console.log('Closed', hadError);
            if (hadError) this._connectLightToServer(light);
          });

          socket.on('error', err => {
            console.error(err);
          });
          this._trigger('music-mode-started', light);
        }
        else {
          console.warn('Unknown light attempted to connect to server', address, this.lights[0].host);
        }
      });

      this.server.on('error', (e) => {
        console.error(JSON.stringify(e));
      });

      FindFreePort(3000, 6000, (err, freePort) => {
        if (err) {
          reject(err);
        }
        else {
          this.server.listen(freePort);
          this.port = freePort;
          resolve();
        }
      });
    });
  }

  findIpInNetwork (remoteIp) {
    const ifaces = Os.networkInterfaces();

    let cidrs = [];
    let host = null;

    Object.keys(ifaces).forEach(function (ifname) {
      ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) return;
        cidrs.push(iface.cidr);
      });
    });

    cidrs.forEach(cidr => {
      if (Ip.cidrSubnet(cidr).contains(remoteIp)) {
        host = cidr.split('/')[0];
      }
    });

    if (!host) throw "Can't find shared network";

    return host;
  };

  async _connectLightToServer (light) {
    let timeouts = [3000, 3000, 5000, 10000, 10000, 20000];
    let maxTimeout = 60000;

    while (!light.musicMode) {
      console.log('Requesting music');
      try {
        let host = this.findIpInNetwork(light.host);
        light.sendCommand("set_music", [1, host, this.port]).catch(e => {
          console.error(e);
        });
      } catch(e) {
        console.warn(e);
      }

      // Wait for connection or timeout
      await new Promise((resolve, reject) => {
        let offAndResolve = () => {
          this.off('music-mode-started', handler);
          resolve();
        };
        let handler = connectedLight => {
          if (connectedLight == light) offAndResolve();
        };

        this.on('music-mode-started', handler);
        this._wait(timeouts.shift() || maxTimeout).then(offAndResolve);
      });
    }
    console.log('Connected to music!');
  }

  _wait(time) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  lookup () {
    let look = new Lookup();
    let ok = false;

    look.on("detected", light => {
      ok = true;
      this.addLight(light);
    });

    let interval = setInterval(() => {
      if (!ok) {
        look.lookup();
      }
      else {
        clearInterval(interval);
      }
    }, 5000);
  }

  addLight (light) {
    this.lights.push(light);
    console.log("New yeelight detected: id=" + light.id + " name=" + light.name);
    this._connectLightToServer(light);
  }

  findLightWithHost (host) {
    return this.lights.find(light => light.host == host);
  }

  _handleColor (dominant) {
    let diff = null;
    if (this.currentDominant) {
      diff =  Math.abs(dominant.color[0] - this.currentDominant.color[0])
              + Math.abs(dominant.color[1] - this.currentDominant.color[1])
              + Math.abs(dominant.color[2] - this.currentDominant.color[2])
              + Math.abs(dominant.light - this.currentDominant.light);
    }

    let currentTime = new Date().getTime();
    let elapsedTime = (currentTime - this.lastUpdate) / 30;

    if (diff + elapsedTime > 50 || !this.currentDominant) {
      this.lights.forEach(light => {
        let duration = Math.max(1000 - diff * 10, 300);

        // Compute number of power off during the last minute
        let first;
        let now = new Date().getTime();
        while (first = this.lastsTurnOff[0]) {
          if (now - first > 60000) this.lastsTurnOff.shift();
          else break;
        }
        let powerOffRate = this.lastsTurnOff.length;

        if (dominant.light <= 1 && light.power && powerOffRate < 14) {
          this.lastsTurnOff.push(new Date().getTime());
          light.setPower(false, duration);
        }
        else if (dominant.light > 1) {
          if (!light.power) {
            light.setPower(true, duration);
            this._connectLightToServer(light);
            light.setRGB(dominant.color, duration);
          }
          else {
            if (light.musicMode) {
              light.musicMode.setRGB(dominant.color, duration);
              light.musicMode.setBright(dominant.light, duration);
            }
          }
        }
      });
      this.currentDominant = dominant;
      this.lastUpdate = currentTime;
    }
  }

}

export default YeelightController;
