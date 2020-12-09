
// import { ipcMain as IpcMain } from 'electron'
// import { Lookup } from 'node-yeelight-wifi'
import Lookup from './CustomLookup'
import Ip from 'ip'
import FindFreePort from 'find-free-port'
import Net from 'net'
import Os from 'os'
import ElectronStore from 'electron-store'
import Log from 'electron-log'

import MusicMode from './MusicMode'
import EventHandler from '../EventHandler.js'

const MAX_TRANSITION_DURATION = 1600;
const TRANSITION_SPEED = 100;
const LIGHT_CHANGE_SPACING = 45;

class YeelightController extends EventHandler {

  constructor () {
    super();

    Log.info('Loading yeelight controller')

    this.lights = [];
    this.lightFinder = new Lookup();
    this.currentDominant = null;
    this.lastUpdate = new Date().getTime();
    this.lastsTurnOff = [];
    this.server = null;
    this.port = null;
    this.targetFps = 10;
    this.brightness = 1;

    this._startServer().then(() => {
      this.lookup();
    }).catch(err => {
      Log.error(err);
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
            light.hadError = hadError;
            Log.info('Closed', hadError);
            this._sendLightUpdate(light);
            if (hadError) this._connectLightToServer(light);
          });

          socket.on('error', err => {
            Log.error(err);
          });
          this._trigger('music-mode-started', light);
        }
        else {
          Log.warn('Unknown light attempted to connect to server', address, this.lights[0].host);
        }
      });

      this.server.on('error', (e) => {
        Log.error(JSON.stringify(e));
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
      if (!light.power) return false;
      Log.info('Requesting music');
      try {
        let host = this.findIpInNetwork(light.host);
        light.sendCommand("set_music", [1, host, this.port]).catch(e => {
          Log.error(e);
        });
      } catch(e) {
        Log.warn(e);
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
    light.hadError = false;
    this._sendLightUpdate(light);
    Log.info('Connected to music!');
    return true;
  }

  _wait (time) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  async lookup (method = 'both') {
    this.lightFinder.on("detected", light => {
      this.addLight(light);
    });

    if (method == 'both' || method == 'lookup') this.lightFinder.lookup();
    if (method == 'both') await this._wait(1000);
    if (method == 'both' || method == 'port') this.lightFinder.findByPortscanning();
  }

  async addLight (light) {
    Log.info("New yeelight detected: id=" + light.id + " name=" + light.name);
    light.syncEnabled = false;
    if (!light.id) {
      await light.sendCommand('get_prop', ['power', 'bright', 'rgb']);
    }
    light.initialState = JSON.parse(JSON.stringify(light.getState()));
    this.lights.push(light);
    this._sendLightUpdate(light);
    this._connectLightToServer(light);
  }

  enableSync (idOrHost) {
    let light = this.findLight(idOrHost);
    light.syncEnabled = true;
    this._sendLightUpdate(light);
  }

  disableSync (idOrHost) {
    let light = this.findLight(idOrHost);
    light.syncEnabled = false;
    light.setPower(light.initialState.power);
    light.setRGB(light.initialState.rgb);
    light.setBright(light.initialState.bright);
    this._sendLightUpdate(light);
  }

  _sendLightUpdate (light) {
    this._trigger('update-light', {
      id: light.id,
      name: light.name,
      host: light.host,
      syncEnabled: light.syncEnabled,
      musicEnabled: !!light.musicMode,
      hadError: !!light.hadError
    });
  }

  requestUpdate () {
    this.lights.forEach(light => {
      this._sendLightUpdate(light);
    });
  }

  findLightWithHost (host) {
    return this.lights.find(light => light.host == host);
  }

  findLightWithId (id) {
    return this.lights.find(light => light.id == id);
  }

  findLight (mixed) {
    let light;
    if (typeof mixed == 'object') light = mixed;
    else light = this.lights.find(light => light.id == mixed || light.host == mixed);
    if (!light) {
      let str = "Couldn't find light with id or host " + mixed;
      Log.error(str);
      Log.info(this.lights);
      throw str;
    }
    return light;
  }

  setTargetFps (fps) {
    this.targetFps = fps;
  }

  setBrightness (brightness) {
    this.brightness = brightness;
  }

  handleColor (dominant) {
    let deltaLightToScreenArray = null;
    let deltaLightToScreen = null;
    if (this.currentDominant) {
      let hueDiff = Math.min(
                      Math.abs(dominant.hsv[0] - this.currentDominant.hsv[0]),
                      (Math.min(dominant.hsv[0], this.currentDominant.hsv[0]) + 360) - Math.max(dominant.hsv[0], this.currentDominant.hsv[0])
                    );
      deltaLightToScreenArray = [
        Math.abs(hueDiff / 180 * 100),
        Math.abs(dominant.hsv[1] - this.currentDominant.hsv[1]),
        Math.abs(dominant.hsv[2] - this.currentDominant.hsv[2]),
        Math.abs(dominant.light - this.currentDominant.light)
      ];
      deltaLightToScreen = deltaLightToScreenArray.reduce((acc, curr) => acc + curr);
    }

    let currentTime = new Date().getTime();
    let elapsedTime = currentTime - this.lastUpdate;

    if (deltaLightToScreen + elapsedTime * elapsedTime / 100000 > LIGHT_CHANGE_SPACING || !this.currentDominant) {
      let baseDelta = Math.sqrt(dominant.delta + deltaLightToScreen) * TRANSITION_SPEED;
      let fpsRelativeCoeff = 1 - (1 / (this.targetFps));
      if (fpsRelativeCoeff > 1) fpsRelativeCoeff = 1;
      else if (fpsRelativeCoeff < 0.2) fpsRelativeCoeff = 0.2;

      let duration = MAX_TRANSITION_DURATION - baseDelta * fpsRelativeCoeff;
      if (duration < 100) duration = 0;

      this.lights.forEach(light => {
        if (light.syncEnabled) {

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
            light.setPower(false, duration).catch(Log.error);
          }
          else if (dominant.light > 1) {
            if (!light.power) {
              light.setPower(true, duration).catch(Log.error);
              this._connectLightToServer(light);
              light.setRGB(dominant.color, duration).catch(Log.error);
            }
            else {
              if (light.musicMode) {
                console.log(dominant.color);
                light.musicMode.setRGB(dominant.color, duration);
                light.musicMode.setBright(dominant.light * this.brightness, duration);
              }
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
