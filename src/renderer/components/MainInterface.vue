<template>
  <div id="interface">
    <!-- <img id="logo" src="~@/assets/logo.png" alt="electron-vue"> -->
    <div class="lights-list">
      <light v-for="light in lights" :key="light.id" :light="light" :color="color"></light>
    </div>
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
</style>
