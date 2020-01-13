<template>
  <div class="light" :class="{ 'had-error': light.hadError, 'sync-enabled': light.syncEnabled }">
    <div class="icon-container">
      <i class="fad fa-lightbulb icon" @click="toggleSync"></i>
    </div>
    <span class="name" contenteditable ref="name" @focus="onNameFocus" @blur="onNameBlur" @keydown.enter.prevent="applyName">{{ light.name || 'Unnamed light' }}</span>
    <span class="host">{{ light.host }}</span>
  </div>
</template>

<script>

  import { ipcRenderer } from 'electron'

  export default {
    name: 'light',
    components: { },
    created() {
    },
    mounted() {
      // Restore saved name
      let lsName = localStorage['light-name-' + this.light.id];
      if (lsName) {
        this.light.name = lsName;
      }
    },
    // Store name when it changes
    watch: {
      name(newName) {
        localStorage['light-name-' + this.light.id] = newName;
      }
    },
    computed: {
      name() {
        return this.light.name;
      },
      host() {
        return this.light.host;
      }
    },
    props: {
      light: {
        required: true,
        type: Object
      },
      color: {
        required: false,
        type: String
      }
    },
    methods: {
      onNameFocus() {
        if (!this.light.name) this.$refs.name.innerHTML = '';
      },
      onNameBlur() {
        if (this.$refs.name.innerHTML != this.light.name) {
          this.light.name = this.$refs.name.innerHTML;
        }
      },
      applyName(event) {
        this.$refs.name.blur();
      },
      toggleSync() {
        if (this.light.syncEnabled) {
          ipcRenderer.send('disable-sync', this.light.id);
        }
        else {
          ipcRenderer.send('enable-sync', this.light.id);
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .light {
    display: flex;
    flex-direction: column;
    align-items: center;

    &.had-error.sync-enabled {
      .icon {
        color: #e88;
      }
    }

    &:not(.sync-enabled) {
      .icon {
        opacity: 0.2;
      }

      .icon-container::before {
        opacity: 1;
      }
    }
  }

  .icon-container {
    position: relative;

    &::before {
      content: 'off';
      position: absolute;
      font-size: 14px;
      top: calc(50% - 8px);
      width: 100%;
      text-align: center;
      text-transform: uppercase;
      font-weight: bold;
      color: #aaa;
      opacity: 0;
      transition-duration: 300ms;
    }
  }

  .icon {
    font-size: 3em;
    padding: 0.2em;
    cursor: pointer;
    transition-duration: 300ms;
  }

  .name {
    height: 1.5em;
    line-height: 1.5em;
    width: 8em;
    outline: none;
    text-align: center;
    font-weight: 400;
    overflow: hidden;
    white-space: nowrap;

    &:hover {
      background-color: rgba(white, 0.03);
    }

    &:active, &:focus {
      background-color: rgba(white, 0.06);
    }
  }

  .host {
    font-weight: 300;
    font-size: 11px;
    opacity: 0.5;
  }
</style>
