<template>
  <div>
    <i class="fad fa-lightbulb"></i>
    {{ light.host }}
  </div>
</template>

<script>

  export default {
    name: 'light',
    components: { },
    created() {

    },
    props: {
      light: {
        required: true,
        type: Object
      }
    },
    methods: {
    }
  }
</script>

<style scoped lang="scss">
  
</style>
