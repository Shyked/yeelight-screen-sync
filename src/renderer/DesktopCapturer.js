
import { desktopCapturer as electronDesktopCapturer } from 'electron'
import Frame from 'canvas-to-buffer'
import EventHandler from '../EventHandler.js'

const QUALITY = {
  width: 320,
  height: 180
};

class DesktopCapturer extends EventHandler {

  constructor () {
    super();
    this._captureDesktopVideo().then(stream => {
      this._stream = stream;
      this._projectStreamInVideoTag(this._stream);
    });
    this._video = document.createElement('video');
    this._canvas = document.createElement('canvas');
    this._frame = new Frame(this._canvas, {
      image: {
        types: ['png']
      }
    });

    (async () => {
      this._stream = await this._captureDesktopVideo();
      await this._projectStreamInVideoTag(this._stream);
      this._eventHappened('ready');
    })();
  }

  _captureDesktopVideo () {
    return new Promise((resolve, reject) => {
      electronDesktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
        for (const source of sources) {
          if (/^screen/.test(source.id)) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: source.id,
                    minWidth: QUALITY.width,
                    maxWidth: QUALITY.width,
                    minHeight: QUALITY.height,
                    maxHeight: QUALITY.height
                  }
                }
              });
              resolve(stream);
            } catch (e) {
              reject(e);
            }
            return
          }
        }
        reject();
      })
    });
  }

  _projectStreamInVideoTag (stream) {
    return new Promise((resolve, reject) => {

      let streaming = false;
      this._video.oncanplay = (ev) => {
        if (!streaming) {
          this._canvas.setAttribute('width', QUALITY.width);
          this._canvas.setAttribute('height', QUALITY.height);
          streaming = true;
        }
      };

      this._video.srcObject = stream;

      this._video.onloadedmetadata = (e) => {
        this._video.play();
        resolve();

        // let colorDiv = document.createElement('div');
        // colorDiv.style = "width: 50px; height: 50px;";
        // document.getElementById('app').appendChild(colorDiv);
        // setInterval(() => {
        //   let t1 = new Date().getTime();
        //   window.getDominantColor().then(dominant => {
        //     let t2 = new Date().getTime();
        //     colorDiv.innerHTML = Math.round(t2 - t1);
        //     ipcRenderer.send('dominant-color', dominant);
        //     colorDiv.style.backgroundColor = `rgb(${dominant.color[0]}, ${dominant.color[1]}, ${dominant.color[2]})`;
        //   });
        // }, 100);
      }
    });
  }

  capture () {
    if (this.didEventHappen('ready')) {
      let ctx = this._canvas.getContext('2d');
      ctx.drawImage(this._video, 0, 0, this._canvas.width, this._canvas.height);
      return this._frame.toBuffer();
    }
    else throw 'Capturer not ready';
  }
}

export default DesktopCapturer
