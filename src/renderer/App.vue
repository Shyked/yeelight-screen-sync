<template>
  <div id="window">
    <title-bar></title-bar>
    <div id="app">
      <main-interface :color="color" :lights="lights"></main-interface>
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
        color: "#ffffff",
        lights: [],
        imagePing: 0
      }
    },
    components: {
      MainInterface,
      TitleBar,
      Color
    },
    created() {

      ipcRenderer.on('update-light', (event, light) => {
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

      let desktopCapturer = new DesktopCapturer();

      desktopCapturer.when('ready').then(() => {
        let imageAnalyzer = new ImageAnalyzer();

        setInterval(() => {
          let t1 = new Date().getTime();
          let imageBuffer = desktopCapturer.capture();
          imageAnalyzer.analyze(imageBuffer).then(dominant => {
            ipcRenderer.send('dominant-color', dominant);
            let t2 = new Date().getTime();
            this.imagePing = t2 - t1;
            this.color = `rgb(${dominant.color[0]}, ${dominant.color[1]}, ${dominant.color[2]})`;
          });
        }, 50);
      });

      ipcRenderer.send('vue-ready');
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
