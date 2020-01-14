/**
 * This file is used specifically and only for development. It installs
 * `electron-debug` & `vue-devtools`. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */

/* eslint-disable */

// Install `electron-debug` with `devtron`
require('electron-debug')()

// Uninstall DevTools extensions https://github.com/electron/electron/issues/19468
const electron = require('electron');
const path = require('path');
const fs = require('fs');
if (process.platform === 'win32') {
  const DevToolsExtensions = path.join(electron.app.getPath('userData'), 'DevTools Extensions')
  try {
    fs.unlinkSync(DevToolsExtensions)
  } catch (_) {
    // noop
  }
}

// Install `vue-devtools`
electron.app.on('ready', () => {
  let installExtension = require('electron-devtools-installer')
  installExtension.default(installExtension.VUEJS_DEVTOOLS)
    .then(() => {})
    .catch(err => {
      console.log('Unable to install `vue-devtools`: \n', err)
    })
})

// Require `main` process to boot app
require('./index')
