<template>
  <div id="title-bar">
    <div class="title">Yeelight Screen Sync</div>
    <div class="buttons">
      <div class="minimize" @click="minimize"><i class="far fa-minus"></i></div>
      <div class="maximize" @click="maximize"><i class="far fa-expand-alt"></i></div>
      <div class="close" @click="close"><i class="far fa-times"></i></div>
    </div>
  </div>
</template>

<script>

  import { remote, ipcRenderer } from 'electron'

  export default {
    name: 'title-bar',
    components: { },
    created() {

    },
    props: {
    },
    methods: {
      minimize () {  
        let electronWindow = remote.BrowserWindow.getFocusedWindow();
        electronWindow.minimize();
      },
      maximize () {
        let electronWindow = remote.BrowserWindow.getFocusedWindow();
        electronWindow.isMaximized() ? electronWindow.unmaximize() : electronWindow.maximize();
        // electronWindow.setFullScreen(!electronWindow.isFullScreen());
      },
      close () {
        let electronWindow = remote.BrowserWindow.getFocusedWindow();
        electronWindow.close();
      }
    }
  }
</script>

<style scoped lang="scss">
  #title-bar {
    display: flex;
    align-items: stretch;
    font-weight: 400;
    font-size: 14px;
    box-sizing: border-box;
    width: 100%;
    height: 30px;
    border: 1px #222 solid;
  }


  .title {
    display: flex;
    align-items: center;
    padding: 14px;
    flex-grow: 1;
    -webkit-user-select: none;
    -webkit-app-region: drag;
  }

  .buttons {
    display: flex;

    > * {
      width: 50px;
      height: 100%;
      background-color: #ff00ff;
      cursor: pointer;
      opacity: 0.6;
      color: white;
      background-color: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;

      i {
        // display: none;
      }

      &:hover {
        opacity: 1;
        color: #222;
        &.minimize {
          background-color: #ffbe2f;
        }

        &.maximize {
          background-color: #2ac940;
        }

        &.close {
          background-color: #f23d35;
        }
      }
    }

    .close {
      font-size: 1.2em;
    }


  }
</style>
