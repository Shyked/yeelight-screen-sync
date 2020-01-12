<template>
  <div class="light" :class="{ 'had-error': light.hadError }">
    <i class="fad fa-lightbulb icon"></i>
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
      }
    }
  }
</script>

<style scoped lang="scss">
  .light {
    display: flex;
    flex-direction: column;
    align-items: center;

    &.had-error {
      .icon {
        color: #e88;
      }
    }
  }

  .icon {
    font-size: 3em;
    padding: 0.2em;
  }

  .name {
    height: 1.5em;
    width: 8em;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
    text-align: center;
    font-weight: 400;

    &:hover {
      background-color: rgba(white, 0.03);
    }

    &:active, &:focus {
      background-color: rgba(white, 0.06);
    }
  }

  .host {
    font-weight: 300;
    font-size: 0.8em;
  }
</style>
