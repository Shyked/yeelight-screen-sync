<template>
  <div>
    <div class="color" :style="{ backgroundColor: color }"></div>
  </div>
</template>

<script>

  export default {
    name: 'color',
    components: { },
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

<style scoped lang="scss">
  .color {
    position: relative;
    width: 100%;
    height: 8px;
    background-color: white;
    box-sizing: border-box;
    pointer-events: none;
  }
</style>
