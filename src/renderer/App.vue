<template>
  <div id="app">
    <main-interface :color="color"></main-interface>
  </div>
</template>

<script>
  import MainInterface from '@/components/MainInterface'

  import { ipcRenderer } from 'electron'
  import DesktopCapturer from './DesktopCapturer'
  import ImageAnalyzer from './ImageAnalyzer'

  export default {
    name: 'electron-led-vue',
    data() {
      return {
        color: "#ffffff",
        lights: []
      }
    },
    components: {
      MainInterface
    },
    created() {

      ipcRenderer.on('new-light', (event, light) => {
        console.log(light);
      });

      let desktopCapturer = new DesktopCapturer();

      desktopCapturer.when('ready').then(() => {
        let imageAnalyzer = new ImageAnalyzer();

        // let colorDiv = document.createElement('div');
        // colorDiv.style = "width: 50px; height: 50px;";
        // document.getElementById('app').appendChild(colorDiv);

        setInterval(() => {
          let t1 = new Date().getTime();
          let imageBuffer = desktopCapturer.capture();
          imageAnalyzer.analyze(imageBuffer).then(dominant => {
            ipcRenderer.send('dominant-color', dominant);
            let t2 = new Date().getTime();
            // colorDiv.innerHTML = t2 - t1;
            // colorDiv.style.backgroundColor = `rgb(${dominant.color[0]}, ${dominant.color[1]}, ${dominant.color[2]})`;
            this.color = `rgb(${dominant.color[0]}, ${dominant.color[1]}, ${dominant.color[2]})`;
          });
        }, 100);
      });

      ipcRenderer.send('vue-ready');
    }
  }
</script>

<style>
  html, body {
    padding: 0;
    margin: 0;
    background-color: #222;
  }
</style>
