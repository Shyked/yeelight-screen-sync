<template>
  <div id="wrapper">
    <!-- <img id="logo" src="~@/assets/logo.png" alt="electron-vue"> -->
    <color :color="color"></color>
  </div>
</template>

<script>
  import Color from './Color'

  export default {
    name: 'main-interface',
    components: { Color },
    created() {

    },
    props: {
      color: {
        required: true,
        type: String
      }
    },
    methods: {
    }
  }
</script>

<style>

</style>
