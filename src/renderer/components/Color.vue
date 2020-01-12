<template>
  <div>
    <div class="color" :style="{ borderColor: color }"></div>
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
    position: absolute;
    width: calc(100% - 10px);
    height: calc(100% - 10px);
    top: 5px;
    left: 5px;
    border: 2px white solid;
    box-sizing: border-box;
  }
</style>
