<template>
  <div class="media-dropdown" :class="{ active: dropdownActive }" ref="dropdown" @click="toggleDropdown">
    <div class="media-dropdown-selected">{{ selectedMedia ? selectedMedia.name : "No media selected" }}</div>
    <div class="media-dropdown-list">
      <div v-for="media in medias" @click="selectMedia(media.id)">{{ media.name }}</div>
    </div>
  </div>
</template>

<script>

  export default {
    name: 'media-selector',
    components: { },
    created() {
      this.$root.$on('click', event => {
        if (this.dropdownActive && !event.target.closest('.media-dropdown')) this.dropdownActive = false;
      });

      this.selectDefault();
    },
    data() {
      return {
        selectedMedia: null,
        dropdownActive: false
      }
    },
    props: {
      medias: {
        required: false,
        type: Object
      }
    },
    watch: {
      selectedMedia() {
        this.$emit('media-changed', this.selectedMedia);
      },
      medias() {
        this.selectDefault();
      }
    },
    methods: {
      toggleDropdown() {
        this.dropdownActive = !this.dropdownActive;
      },
      selectMedia(mediaId) {
        this.selectedMedia = this.medias[mediaId];
      },
      selectDefault() {
        if (!this.selectedMedia && Object.keys(this.medias).length > 0) {
          this.selectMedia(Object.keys(this.medias)[0]);
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .media-dropdown {
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

    .media-dropdown-list {
      position: absolute;
      width: 240px;
      bottom: 100%;
      left: 0;
      opacity: 0;
      transform-origin: 50% 100%;
      transform: scaleY(0.9) translateY(0px);
      pointer-events: none;
      transition-duration: 300ms;
      max-height: 100px;
      overflow-y: auto;

      > * {
        height: 25px;
        line-height: 25px;
        background-color: #222;
        width: 100%;
        padding: 0 16px;
        box-sizing: border-box;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &:hover {
          background-color: #2d2d2d;
        }
      }
    }

    &.active .media-dropdown-list {
      opacity: 1;
      transform: scaleY(1) translateY(0);
      pointer-events: auto;
    }
  }
</style>
