import { app, BrowserWindow, ipcMain } from 'electron'

import YeelightController from './YeelightController'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    webPreferences: {nodeIntegration: true}
  })

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.on("did-frame-finish-load", () => {
      mainWindow.webContents.once("devtools-opened", () => {
        mainWindow.focus();
      });
      mainWindow.webContents.openDevTools();
    });
  }

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('vue-ready', () => {
  console.log("ready");
  let yeelightController = new YeelightController();

  ipcMain.on('dominant-color', (event, dominant) => {
    yeelightController.handleColor(dominant);
  });

  let proxys = [
    'new-light'
  ];

  proxys.forEach(eventName => {
    yeelightController.on(eventName, function() {
      mainWindow.webContents.send.apply(mainWindow.webContents, [eventName].concat(Array.from(arguments)));
    });
  });
});
