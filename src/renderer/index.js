// In the renderer process.
const { desktopCapturer, ipcRenderer } = require('electron')
const Frame = require('canvas-to-buffer');
const Vibrant = require('node-vibrant');
const Readable = require('stream').Readable;
const PNG = require('pngjs').PNG;
const Jimp = require('jimp');

desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
  for (const source of sources) {
    if (/^screen/.test(source.id)) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id,
              minWidth: 320,
              maxWidth: 320,
              minHeight: 180,
              maxHeight: 180
            }
          }
        })
        handleStream(stream)
      } catch (e) {
        handleError(e)
      }
      return
    }
  }
})

const video = document.createElement('video');
const canvas = document.createElement('canvas');

const frame = new Frame(canvas, {
  image: {
    types: ['png']
  }
});


function handleStream (stream) {
  let streaming = false;
  video.addEventListener('canplay', function(ev){
    if (!streaming) {
      width = 640;
      height = 360;
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      streaming = true;
    }
  }, false);
  video.srcObject = stream;
  video.onloadedmetadata = (e) => {
    video.play();
    let colorDiv = document.createElement('div');
    colorDiv.style = "width: 50px; height: 50px;";
    document.getElementById('app').appendChild(colorDiv);
    setInterval(() => {
      let t1 = new Date().getTime();
      window.getDominantColor().then(dominant => {
        let t2 = new Date().getTime();
        colorDiv.innerHTML = Math.round(t2 - t1);
        ipcRenderer.send('dominant-color', dominant);
        colorDiv.style.backgroundColor = `rgb(${dominant.color[0]}, ${dominant.color[1]}, ${dominant.color[2]})`;
      });
    }, 100);
  }
}

function handleError (e) {
  console.log(e)
}

function takepicture() {
  var ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return frame.toBuffer();
}

window.getDominantColor = function() {
  return new Promise((resolve, reject) => {
    let buffer = takepicture();
    withJimp(buffer).then(dominant => {
      resolve(dominant);
    });
  });
};

// var withVibrant = function(blob) {
//   return new Promise((resolve, reject) => {
//     let v = new Vibrant(blob, {
//       quality: 1
//     });
//     v.getPalette((err, palette) => {
//       let totalPopulation = 0;
//       let finalColor = [0, 0, 0];
//       let light = 0;
//       ['Vibrant', 'DarkVibrant', 'LightVibrant', 'Muted', 'DarkMuted', 'LightMuted'].forEach(brightness => {
//         let population = palette[brightness].getPopulation();
//         if (~brightness.indexOf('Vibrant')) population *= 4;
//         if (~brightness.indexOf('Light') || ~brightness.indexOf('Dark')) population /= 4;

//         let color = palette[brightness].getRgb();
//         for (var i = 2; i >= 0; i--) {
//           finalColor[i] += color[i] * population;
//         }

//         if (~brightness.indexOf('Light'))     light += 1 * population;
//         else if (~brightness.indexOf('Dark')) light += 0 * population;
//         else                                  light += 0.5 * population;
        
//         totalPopulation += population;
//       });

//       light = Math.min(Math.max(0, (light / totalPopulation) * 2 - 0.5), 1) * 100;

//       for (var i = 2; i >= 0; i--) {
//         finalColor[i] /= totalPopulation;
//       }

//       resolve({
//         color: finalColor.slice(0, 3),
//         light: light
//       });
//     });
//   });
// };

// var withCustom = function(img) {
//   return new Promise((resolve, reject) => {
//     bufferToReadable(img)
//       .pipe(new PNG({ filterType: 1}))
//       .on('parsed', function() {
//         var colorsList = {
//           r: {},
//           g: {},
//           b: {}
//         };
//         var total = 0;

//         for (var y = 0; y < this.height; y++) {
//           for (var x = 0; x < this.width; x++) {
//             var idx = (this.width * y + x) << 2;
//             let px = {
//               r: this.data[idx + 0],
//               g: this.data[idx + 1],
//               b: this.data[idx + 2]
//             };

//             let v = Math.max(px.r, px.g, px.b);
//             let diff = v - Math.min(px.r, px.g, px.b);
//             let s = diff == 0 ? 0 : diff / v;
//             let colorWeight = s * v;

//             colorsList.r[px.r] = (colorsList.r[px.r] || 0) + colorWeight;
//             colorsList.g[px.g] = (colorsList.g[px.g] || 0) + colorWeight;
//             colorsList.b[px.b] = (colorsList.b[px.b] || 0) + colorWeight;
//             total += colorWeight;
//           }
//         }
        
//         var getMed = function(obj) {
//           let count = 0;
//           for (var i = 0; i <= 255; i++) {
//             count += obj[i] || 0;
//             if (count >= total / 2) return i;
//           }
//         };

//         var getMean = function(obj) {
//           let total = 0;
//           let count = 0;
//           for (var i = 0; i <= 255; i++) {
//             total += (obj[i] || 0) * i;
//             count += (obj[i] || 0);
//           }
//           return count != 0 ? total / count : 0;
//         };

//         var meds = [
//           getMed(colorsList.r),
//           getMed(colorsList.g),
//           getMed(colorsList.b)
//         ];

//         var means = [
//           getMean(colorsList.r),
//           getMean(colorsList.g),
//           getMean(colorsList.b)
//         ];

//         let meanHsv = rgbToHsv(means[0], means[1], means[2]);
//         let hsv = rgbToHsv(meds[0], meds[1], meds[2]);
//         hsv.s = Math.min(hsv.s * 1.6, 100);
//         hsv.v = meanHsv.v;
//         let rgb = hsvToRgb(hsv);

//         resolve({
//           color: [rgb.r, rgb.g, rgb.b],
//           light: (hsv.v / 100) * (hsv.v / 100) * 100
//         });
//       });
//   });
// };

var withJimp = function(buffer) {
  return new Promise((resolve, reject) => {
    Jimp.read(buffer).then(image => {
      var colorsList = {
        r: {},
        g: {},
        b: {}
      };
      var total = 0;

      var max, min, px, v, diff, s, colorWeight;
      for (var y = 0; y < image.bitmap.height; y++) {
        for (var x = 0; x < image.bitmap.width; x++) {
          var px = Jimp.intToRGBA(image.getPixelColor(x, y));

          // var v = Math.max(px.r, px.g, px.b);
          max = px.r > px.g ? (px.b > px.r ? px.b : px.r) : (px.b > px.g ? px.b : px.g);
          v = max;
          min = px.r < px.g ? (px.b < px.r ? px.b : px.r) : (px.b < px.g ? px.b : px.g);
          diff = v - min;
          s = diff == 0 ? 0 : diff / v;
          colorWeight = s * v + 1;

          colorsList.r[px.r] = (colorsList.r[px.r] || 0) + colorWeight;
          colorsList.g[px.g] = (colorsList.g[px.g] || 0) + colorWeight;
          colorsList.b[px.b] = (colorsList.b[px.b] || 0) + colorWeight;
          total += colorWeight;
        }
      }
      
      var getMed = function(obj) {
        let count = 0;
        for (var i = 0; i <= 255; i++) {
          count += obj[i] || 0;
          if (count >= total / 2) return i;
        }
      };

      var getMean = function(obj) {
        let total = 0;
        let count = 0;
        for (var i = 0; i <= 255; i++) {
          total += (obj[i] || 0) * i;
          count += (obj[i] || 0);
        }
        return count != 0 ? total / count : 0;
      };

      var meds = [
        getMed(colorsList.r),
        getMed(colorsList.g),
        getMed(colorsList.b)
      ];

      var means = [
        getMean(colorsList.r),
        getMean(colorsList.g),
        getMean(colorsList.b)
      ];

      let meanHsv = rgbToHsv(means[0], means[1], means[2]);
      let hsv = rgbToHsv(meds[0], meds[1], meds[2]);
      hsv.s = Math.min(hsv.s * 1.6, 100);
      hsv.v = Math.min(meanHsv.v * 2, 100);
      let rgb = hsvToRgb(hsv);


      if (rgb.r + rgb.g + rgb.b < 15) {
        rgb.r = rgb.g = rgb.b = 10;
        hsv.v = 0;
      }

      if (hsv.v == 0) hsv.V = 1;

      resolve({
        color: [rgb.r, rgb.g, rgb.b],
        light: (hsv.v / 100) * (hsv.v / 100) * 100
      });
    }).catch(err => {
      console.error(err);
    });
  });
};

var bufferToReadable = function(buffer) {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
};

function rgbToHsv (r, g, b) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs),
    diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
            h = bb - gg;
        } else if (gabs === v) {
            h = (1 / 3) + rr - bb;
        } else if (babs === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: percentRoundFn(s * 100),
        v: percentRoundFn(v * 100)
    };
}

function hsvToRgb(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    h /= 360;
    s /= 100;
    v /= 100;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}
