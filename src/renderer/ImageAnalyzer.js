import Jimp from 'jimp';

class ImageAnalyzer {

  constructor () {
    this._lastMeans = null;
  }

  analyze (buffer) {
    return new Promise((resolve, reject) => {
      Jimp.read(buffer).then(image => {
        let histogram = {
          r: {},
          g: {},
          b: {}
        };
        let total = 0;

        let max, min, px, v, diff, s, colorWeight;
        for (let y = 0; y < image.bitmap.height; y++) {
          for (let x = 0; x < image.bitmap.width; x++) {
            let px = Jimp.intToRGBA(image.getPixelColor(x, y));

            max = px.r > px.g ? (px.b > px.r ? px.b : px.r) : (px.b > px.g ? px.b : px.g);
            v = max;
            min = px.r < px.g ? (px.b < px.r ? px.b : px.r) : (px.b < px.g ? px.b : px.g);
            diff = v - min;
            s = diff == 0 ? 0 : diff / v;
            colorWeight = (s * v) / 20 + 1;

            histogram.r[px.r] = (histogram.r[px.r] || 0) + colorWeight;
            histogram.g[px.g] = (histogram.g[px.g] || 0) + colorWeight;
            histogram.b[px.b] = (histogram.b[px.b] || 0) + colorWeight;
            total += colorWeight;
          }
        }

        let meds = [
          this.getMed(histogram.r, total),
          this.getMed(histogram.g, total),
          this.getMed(histogram.b, total)
        ];

        let means = [
          this.getMean(histogram.r),
          this.getMean(histogram.g),
          this.getMean(histogram.b)
        ];

        let meanHsv = this.rgbToHsv(means[0], means[1], means[2]);
        // let hsv = this.rgbToHsv(meds[0], meds[1], meds[2]);
        let hsv = this.rgbToHsv((means[0] + meds[0]) / 2, (means[1] + meds[1]) / 2, (means[2] + meds[2]) / 2);
        hsv.s = Math.min(hsv.s * 1.3, 100);
        hsv.v = Math.min(meanHsv.v * 2, 100);
        let rgb = this.hsvToRgb(hsv);

        let delta;
        if (this._lastMeans) {
          delta = Math.abs(this._lastMeans[0] - means[0])
                  + Math.abs(this._lastMeans[1] - means[1])
                  + Math.abs(this._lastMeans[2] - means[2]);
        }
        else delta = 100;


        if (rgb.r + rgb.g + rgb.b < 15) {
          rgb.r = rgb.g = rgb.b = 10;
          hsv.v = 1;
        }

        this._lastMeans = means;

        resolve({
          color: [rgb.r, rgb.g, rgb.b],
          light: (hsv.v / 100) * (hsv.v / 100) * 100,
          delta: delta
        });
      }).catch(err => {
        console.error(err);
      });
    });
  }

  getMed (obj, total) {
    let count = 0;
    for (var i = 0; i <= 255; i++) {
      count += obj[i] || 0;
      if (count >= total / 2) return i;
    }
  }

  getMean (obj) {
    let total = 0;
    let count = 0;
    for (var i = 0; i <= 255; i++) {
      total += (obj[i] || 0) * i;
      count += (obj[i] || 0);
    }
    return count != 0 ? total / count : 0;
  }

  rgbToHsv (r, g, b) {
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
      } else if (h > 1) {
        h -= 1;
      }
    }
    return {
      h: Math.round(h * 360),
      s: percentRoundFn(s * 100),
      v: percentRoundFn(v * 100)
    };
  }

  hsvToRgb (h, s, v) {
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

}

export default ImageAnalyzer
