# Yeelight Screen Sync

This project is meant to synchronize your Yeelight with the colors displayed on your screen.

It is built with Electron Vue, and thus divided in two parts:

- The main process, that handles the connection between the current device and the yeelight,
- The renderer, that captures the screen and extracts the dominant color displayed on the screen.

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron application for production
npm run build


```

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[45a3e22](https://github.com/SimulatedGREG/electron-vue/tree/45a3e224e7bb8fc71909021ccfdcfec0f461f634) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
