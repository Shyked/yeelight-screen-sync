<template>
  <div id="wrapper">
    <!-- <img id="logo" src="~@/assets/logo.png" alt="electron-vue"> -->
    <color :color="color"></color>
    <light v-for="light in lights" :key="light.id" :light="light"></light>
  </div>
</template>

<script>
  import Color from './Color'
  import Light from './Light'

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
        type: Object
      }
    },
    methods: {
    }
  }
</script>

<style>

</style>
