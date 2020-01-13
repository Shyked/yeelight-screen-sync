<template>
  <div id="window">
    <title-bar></title-bar>
    <div id="app">
      <main-interface :color="color" :lights="lights"></main-interface>
<!--       <div>{{ imagePing }}</div>
      <div>{{ fps }}</div> -->
    </div>
    <color :color="color"></color>
  </div>
</template>

<script>
  import MainInterface from '@/components/MainInterface'
  import TitleBar from '@/components/TitleBar'
  import Color from '@/components/Color'

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
        lastRun: new Date().getTime()
      }
    },
    computed: {
      fps() {
        return this.lastRun - this.previousRun;
      }
    },
    components: {
      MainInterface,
      TitleBar,
      Color
    },
    created() {

      ipcRenderer.on('update-light', (event, light) => {
        if (!light.id) light.id = light.host;
        if (!this.lights) {
          this.$set(this, 'lights', [ light ]);
        }
        else {
          let existingLight = this.lights.find(existingLight => existingLight.id == light.id);
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

      this.desktopCapturer.when('ready', () => {
        window.runningDominant = window.runningDominant ? window.runningDominant + 1 : 1;
        window.addEventListener('message', (event) => {
          let split = event.data.split('-');
          if (split[0] == 'dominant') {
            this.getDominant(split[1]);
          }
        });
        this.getDominant(window.runningDominant);
      });

      ipcRenderer.send('vue-ready');
    },
    methods: {
      getDominant(id) {
        if (id == window.runningDominant) {
          let t1 = new Date().getTime();
          let imageBuffer = this.desktopCapturer.capture();
          this.imageAnalyzer.analyze(imageBuffer).then(dominant => {
            ipcRenderer.send('dominant-color', dominant);
            let t2 = new Date().getTime();
            this.imagePing = t2 - t1;
            this.color = `rgb(${dominant.color[0]}, ${dominant.color[1]}, ${dominant.color[2]})`;
            this.fpsCheck();
            setTimeout(() => {
              window.postMessage('dominant-' + id);
            }, 80);
          });
        }
      },
      fpsCheck() {
        this.previousRun = this.lastRun;
        this.lastRun = new Date().getTime();
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

  #window {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  #app {
    flex-grow: 1;
    position: relative;
    padding: 10px;
    background-color: #222;
    overflow: auto;
  }
</style>
