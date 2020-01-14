<template>
  <div class="fps-dropdown" :class="{ active: dropdownActive }" ref="dropdown" @click="toggleDropdown">
    <div class="fps-dropdown-selected">{{ selectedFps }} FPS</div>
    <div class="fps-dropdown-list">
      <div v-for="fps in fpsList" @click="selectFps(fps)">{{ fps }}</div>
    </div>
  </div>
</template>

<script>

  export default {
    name: 'fps-selector',
    components: { },
    created() {
      this.selectedFps = 10;

      this.$root.$on('click', event => {
        if (this.dropdownActive && !event.target.closest('.fps-dropdown')) this.dropdownActive = false;
      });
    },
    data() {
      return {
        fpsList: [1, 5, 10, 30, 60],
        selectedFps: null,
        dropdownActive: false
      }
    },
    props: {
      
    },
    watch: {
      selectedFps() {
        this.$emit('fps-changed', this.selectedFps);
      }
    },
    methods: {
      toggleDropdown() {
        this.dropdownActive = !this.dropdownActive;
      },
      selectFps(fps) {
        this.selectedFps = fps;
      }
    }
  }
</script>

<style scoped lang="scss">
  .fps-dropdown {
    height: 100%;
    opacity: 0.6;
    background-image: none;
    background-color: transparent;
    color: rgba(white, 0.8);
    cursor: pointer;
    padding: 0 16px;
    display: flex;
    align-items: center;
    position: relative;

    &:hover {
      background-color: rgba(white, 0.03);
      opacity: 1;
    }

    &.active, &:active {
      background-color: rgba(white, 0.08);
      opacity: 1;
    }

    .fps-dropdown-list {
      position: absolute;
      width: 100%;
      bottom: 100%;
      left: 0;
      opacity: 0;
      transform-origin: 50% 100%;
      transform: scaleY(0.9) translateY(0px);
      pointer-events: none;
      transition-duration: 300ms;

      > * {
        height: 25px;
        display: flex;
        align-items: center;
        background-color: #222;
        width: 100%;
        padding: 0 16px;
        box-sizing: border-box;
        white-space: nowrap;

        &:hover {
          background-color: #2d2d2d;
        }
      }
    }

    &.active .fps-dropdown-list {
      opacity: 1;
      transform: scaleY(1) translateY(0);
      pointer-events: auto;
    }
  }
</style>
