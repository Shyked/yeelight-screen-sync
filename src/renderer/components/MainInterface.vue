<template>
  <div id="interface">
    <!-- <img id="logo" src="~@/assets/logo.png" alt="electron-vue"> -->
    <div class="lights-list">
      <light v-for="light in lights" :key="light.id" :light="light" :color="color"></light>
    </div>
    <button class="scan" @click="scan">
      Re-scan
      <i class="far fa-sync icon" ref="scanIcon"></i>
    </button>
  </div>
</template>

<script>
  import Color from './Color'
  import Light from './Light'

  import { ipcRenderer } from 'electron'

  export default {
    name: 'main-interface',
    components: { Color, Light },
    created() {

    },
    props: {
      color: {
        required: true,
        type: String
      },
      lights: {
        required: true,
        type: Array
      }
    },
    methods: {
      scan() {
        this.$refs.scanIcon.classList.add('animate');
        this.restartAnimation(this.$refs.scanIcon);
        ipcRenderer.send('scan');
      },
      restartAnimation(element) {
        element.style.display = "none";
        void element.offsetWidth;
        element.style.display = "";
      }
    }
  }
</script>

<style lang="scss">
  #interface {
    position: relative;
    width: 100%;
    min-height: 100%;
  }

  .lights-list {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }

  .scan {
    position: absolute;
    bottom: 5px;
    right: 5px;
    text-transform: uppercase;
    font-size: 13px;
    opacity: 0.6;
    border: none;
    background-image: none;
    background-color: transparent;
    outline: none;
    color: rgba(white, 0.8);
    cursor: pointer;
    border-radius: 2px;
    padding: 2px 4px;

    &:active {
      transform: scale(0.95);
    }

    &:hover {
      background-color: rgba(white, 0.1);
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
