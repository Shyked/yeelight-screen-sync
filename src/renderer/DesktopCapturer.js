
import { desktopCapturer as electronDesktopCapturer } from 'electron'
import Frame from 'canvas-to-buffer'
import EventHandler from '../EventHandler.js'

const QUALITY = {
  width: 64,
  height: 36
};

class DesktopCapturer extends EventHandler {

  constructor () {
    super();
  }

  init () {
    this._video = document.createElement('video');
    this._canvas = new OffscreenCanvas(QUALITY.width, QUALITY.height);
    this._frame = new Frame(this._canvas, {
      image: {
        types: ['png']
      }
    });
  }

  getCanvas () {
    return this._canvas;
  }

  getMedias () {
    return new Promise(async (resolve, reject) => {
      let list = {};

      let sources = await electronDesktopCapturer.getSources({ types: ['window', 'screen'] });
      for (const source of sources) {
        if (/^screen/.test(source.id)) {
          list[source.id] = {
            id: source.id,
            name: source.name,
            type: 'screen'
          };
        }
      }

      let devices = await navigator.mediaDevices.enumerateDevices()
      devices.forEach(function(device) {
        if (device.kind == 'videoinput') {
          list[device.deviceId] = {
            id: device.deviceId,
            name: device.label,
            type: 'device'
          };
        }
      });
      resolve(list);
    });
  }

  async captureMedia (media) {
    this._stream = await this._captureVideo(media);
    await this._projectStreamInVideoTag(this._stream);
    this._eventHappened('ready');
  }

  _captureVideo (media) {
    return new Promise(async (resolve, reject) => {
      let video;
      if (media.type == 'screen') {
        video = {
          mandatory: {
            chromeMediaSource: media.type == 'screen' ? 'desktop' : null,
            chromeMediaSourceId: media.id,
            minWidth: QUALITY.width,
            maxWidth: QUALITY.width,
            minHeight: QUALITY.height,
            maxHeight: QUALITY.height
          }
        }
      }
      else {
        video = {
          deviceId: { exact: media.id },
          width: QUALITY.width,
          height: QUALITY.height
        }
      }
      navigator.getUserMedia({
        audio: false,
        video: video
      }, (stream) => {
        resolve(stream);
      }, () => {});
    });
  }

  _projectStreamInVideoTag (stream) {
    return new Promise((resolve, reject) => {
      this._video.srcObject = stream;

      this._video.onloadedmetadata = (e) => {
        this._video.play();
        resolve();
      };
    });
  }

  capture () {
    return (async () => {
      if (this.didEventHappen('ready')) {
        let ctx = this._canvas.getContext('2d');
        ctx.drawImage(this._video, 0, 0, this._canvas.width, this._canvas.height);
        let blob;
        blob = await this._canvas.convertToBlob();
        let arrayBuffer = blob.arrayBuffer();
        return arrayBuffer;
      }
      else throw 'Capturer not ready';
    })();
  }

  captureBitmap () {
    return this._canvas.transferToImageBitmap();
  }
}

export default DesktopCapturer
