<template>
  <div class="brightness-dropdown" :class="{ active: dropdownActive }" ref="dropdown" @click="toggleDropdown">
    <div class="brightness-dropdown-selected">
      <span v-if="selectedBrightness === 1" class="icon fad fa-sun"></span>
      <span v-if="selectedBrightness === 0.3" class="icon fad fa-candle-holder"></span>
      <span v-if="selectedBrightness === 0.02" class="icon fad fa-moon"></span>
    </div>
    <div class="brightness-dropdown-list">
      <div v-for="brightness in brightnessList" :key="brightness" @click="selectBrightness(brightness)">
        <span v-if="brightness === 1" class="icon fad fa-sun"></span>
        <span v-if="brightness === 0.3" class="icon fad fa-candle-holder"></span>
        <span v-if="brightness === 0.02" class="icon fad fa-moon"></span>
      </div>
    </div>
  </div>
</template>

<script>

  export default {
    name: 'brightness-selector',
    components: { },
    created() {
      this.selectedBrightness = 1;

      this.$root.$on('click', event => {
        if (this.dropdownActive && !event.target.closest('.brightness-dropdown')) this.dropdownActive = false;
      });
    },
    data() {
      return {
        brightnessList: [0.02, 0.3, 1],
        selectedBrightness: null,
        dropdownActive: false
      }
    },
    props: {
      
    },
    watch: {
      selectedBrightness() {
        this.$emit('brightness-changed', this.selectedBrightness);
      }
    },
    methods: {
      toggleDropdown() {
        this.dropdownActive = !this.dropdownActive;
      },
      selectBrightness(brightness) {
        this.selectedBrightness = brightness;
      }
    }
  }
</script>

<style scoped lang="scss">
  .brightness-dropdown {
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
    font-size: 16px;

    &:hover {
      background-color: rgba(white, 0.03);
      opacity: 1;
    }

    &.active, &:active {
      background-color: rgba(white, 0.08);
      opacity: 1;
    }

    .brightness-dropdown-selected {
      font-size: 18px;
    }

    .brightness-dropdown-list {
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
        height: 35px;
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

    &.active .brightness-dropdown-list {
      opacity: 1;
      transform: scaleY(1) translateY(0);
      pointer-events: auto;
    }
  }
</style>
