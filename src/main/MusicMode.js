
class MusicMode {

  constructor (socket) {
    this.socket = socket;
  }

  setRGB (rgb, duration) {
    let color = (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
    let params = {
      id: 1,
      method: 'set_rgb',
      params: [color, (duration == 0 ? 'sudden' : 'smooth'), duration]
    };
    this.socket.write(JSON.stringify(params) + '\r\n');
  }

  setBright (bright, duration) {
    let params = {
      id: 1,
      method: 'set_bright',
      params: [bright, (duration == 0 ? 'sudden' : 'smooth'), duration]
    };
    this.socket.write(JSON.stringify(params) + '\r\n');
  }

  setPower (power, duration) {
    let params = {
      id: 1,
      method: 'set_power',
      params: [power, (duration == 0 ? 'sudden' : 'smooth'), duration]
    };
    this.socket.write(JSON.stringify(params) + '\r\n');
  }
}

export default MusicMode;
