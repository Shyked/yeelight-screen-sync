# Yeelight Screen Sync

This project is meant to synchronize your Yeelight with the colors displayed on your screen.

It is built with Electron, and thus divided in two parts:

- The main process, that handles the connection between the current device and the yeelight,
- The renderer, that captures the screen and extracts the dominant color displayed on the screen.

### Development Scripts

This repository uses Electron Builder. Use the following commands to run and build your project:

```bash
# run application in development mode
yarn dev

# compile source code and create webpack output
yarn compile

# `yarn compile` & create build with electron-builder
yarn dist

# `yarn compile` & create unpacked build with electron-builder
yarn dist:dir
```
