<template>
  <div id="window" @click="onClick">
    <div class="background-image-container">
      <canvas id="canvas0" ref="canvas0" class="background-image" :class="{ shown: canvasShown == 0 }"></canvas>
      <canvas id="canvas1" ref="canvas1" class="background-image" :class="{ shown: canvasShown == 1 }"></canvas>
    </div>
    <title-bar></title-bar>
    <div id="app">
      <main-interface :color="color" :lights="lights"></main-interface>
    </div>
    <div class="bottom-bar">
      <fps-selector @fps-changed="updateFps"></fps-selector>
      <media-selector @media-changed="updateMedia" :medias="medias" class="media-selector"></media-selector>
      <div id="lag">Lag: {{ meanLag }} ms</div>
      <div class="separator"></div>
      <button class="scan" @click="scan">
        Re-scan
        <i class="far fa-sync icon" ref="scanIcon"></i>
      </button>
    </div>
    <color :color="color"></color>
  </div>
</template>

<script>
  import MainInterface from '@/components/MainInterface'
  import TitleBar from '@/components/TitleBar'
  import Color from '@/components/Color'
  import FpsSelector from '@/components/FpsSelector'
  import MediaSelector from '@/components/MediaSelector'

  import { ipcRenderer } from 'electron'
  import DesktopCapturer from './DesktopCapturer'
  import ImageAnalyzer from './ImageAnalyzer'

  export default {
    name: 'yeelight-screen-sync',
    data() {
      return {
        desktopCapturer: new DesktopCapturer(),
        imageAnalyzer: new ImageAnalyzer(),
        color: "#ffffff",
        lights: [],
        imagePing: 0,
        previousRun: new Date().getTime(),
        lastRun: new Date().getTime(),
        targetFps: 1,
        medias: {},
        lag: [],
        lastPreviewExtraction: new Date().getTime(),
        canvasShown: 0
      }
    },
    computed: {
      fps() {
        return (1000 / (this.lastRun - this.previousRun)).toFixed(2);
      },
      canvas() {
        return this.desktopCapturer.getCanvas()
      },
      meanLag() {
        return Math.trunc(this.lag.length == 0 ? 0 : this.lag.reduce((acc, curr) => (acc + curr), 0) / this.lag.length);
      }
    },
    components: {
      MainInterface,
      TitleBar,
      Color,
      FpsSelector,
      MediaSelector
    },
    watch: {
      targetFps (value) {
        ipcRenderer.send('fps-changed', value);
      }
    },
    created() {
      ipcRenderer.on('update-light', (event, light) => {
        if (!light.id) light.id = light.host;
        if (!this.lights) {
          this.$set(this, 'lights', [ light ]);
        }
        else {
          let existingLight = this.lights.find(existingLight => existingLight.id == light.id || existingLight.host == light.host);
          if (existingLight) {
            for (let id in existingLight) {
              if (existingLight.hasOwnProperty(id)) {
                if (id != 'name') existingLight[id] = light[id];
              }
            }
          }
          else this.lights.push(light);
        }
      });
    },
    mounted() {
      this.desktopCapturer.init();

      this.desktopCapturer.getMedias().then(medias => {
        this.medias = medias;
      });

      this.desktopCapturer.when('ready', () => {
        window.runningDominant = window.runningDominant ? window.runningDominant + 1 : 1;
        window.addEventListener('message', (event) => {
          if (event.data && typeof event.data == 'string') {
            let split = event.data.split('-');
            if (split[0] == 'dominant') {
              this.getDominant(split[1]);
            }
          }
        });
        this.getDominant(window.runningDominant);
      });

      ipcRenderer.send('vue-ready');
    },
    methods: {

      async getDominant(id) {
        if (id == window.runningDominant) {
          let t1 = new Date().getTime();
          let imageBuffer = await this.desktopCapturer.capture();
          this.imageAnalyzer.analyze(imageBuffer).then(dominant => {
            ipcRenderer.send('dominant-color', dominant);

            this.color = `rgb(${dominant.color[0]}, ${dominant.color[1]}, ${dominant.color[2]})`;

            let now = new Date().getTime();
            if (now - this.lastPreviewExtraction > 4000) {
              let nextCanvas = -this.canvasShown + 1;
              let bitmap = this.desktopCapturer.captureBitmap();
              let ctx = this.$refs['canvas' + nextCanvas].getContext('bitmaprenderer');
              ctx.transferFromImageBitmap(bitmap);
              this.lastPreviewExtraction = new Date().getTime();
              this.canvasShown = nextCanvas;
            }

            let t2 = new Date().getTime();
            let computeTime = t2 - t1;
            this.lag.unshift(computeTime);
            this.lag.splice(this.targetFps);
            // console.log('full', computeTime);

            this.pingCheck();
            let timeout = 1000 / this.targetFps - computeTime;

            if (timeout <= 3) { // setTimeout 0 takes 0~3ms
              window.postMessage('dominant-' + id);
            }
            else {
              setTimeout(() => {
                window.postMessage('dominant-' + id);
              }, timeout);
            }
          });
        }
      },

      pingCheck() {
        this.previousRun = this.lastRun;
        this.lastRun = new Date().getTime();
      },

      scan() {
        this.$refs.scanIcon.classList.add('animate');
        this.restartAnimation(this.$refs.scanIcon);
        ipcRenderer.send('scan');
      },

      restartAnimation(element) {
        element.style.display = "none";
        void element.offsetWidth;
        element.style.display = "";
      },

      updateFps(fps) {
        this.targetFps = fps;
      },

      updateMedia(media) {
        this.desktopCapturer.captureMedia(media);
      },

      onClick(event) {
        this.$root.$emit('click', event);
      }

    }
  }
</script>

<style lang="scss">
  @import url('~@/assets/fontawesome/css/fontawesome.min.css');
  @import url('~@/assets/fontawesome/css/duotone.min.css');
  @import url('~@/assets/fontawesome/css/brands.min.css');
  @import url('~@/assets/fontawesome/css/regular.min.css');
  @import url('~@/assets/fonts/FiraSans/FiraSans.css');

  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    color: white;
    font-family: 'Fira Sans', sans-serif;
  }

  *::-webkit-scrollbar {
    width: 8px;
    background-color: #1b1b1b;
  }

  *::-webkit-scrollbar-thumb {
    background-color: #2d2d2d;
  }

  #window {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: #222;

    > * {
      flex-shrink: 0;
    }

    > #app {
      flex-shrink: 1;
    }
  }

  .background-image-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.1;
    filter: blur(10px);

    .background-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 1;

      &.shown {
        z-index: 1;
        animation: show-canvas .8s ease-in-out;
      }

      @keyframes show-canvas {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
    }
  }

  #app {
    flex-grow: 1;
    position: relative;
    padding: 10px;
    overflow: auto;
  }

  .bottom-bar {
    position: relative;
    width: 100%;
    height: 40px;
    bottom: 0;
    font-size: 13px;
    display: flex;

    .separator {
      flex-grow: 1;
    }
  }

  #lag {
    height: 100%;
    width: 80px;
    opacity: 0.6;
    color: rgba(white, 0.8);
    cursor: pointer;
    padding: 0 16px;
    display: flex;
    align-items: center;
    position: relative;

    &:hover {
      background-color: rgba(white, 0.03);
      opacity: 1;
    }
  }

  .scan {
    height: 100%;
    text-transform: uppercase;
    opacity: 0.6;
    border: none;
    background-image: none;
    background-color: transparent;
    outline: none;
    color: rgba(white, 0.8);
    cursor: pointer;
    padding: 0 16px;

    &:active, &:hover:active {
      background-color: rgba(white, 0.08);
    }

    &:hover {
      background-color: rgba(white, 0.03);
      opacity: 1;
    }

    .icon.animate {
      animation: spin 1s;
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
