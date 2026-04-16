const log = require('electron-log');
const { app } = require('electron');

let mainWindow = null;

const LATEST_VERSION = '1.0.39';

function initAutoUpdater(window) {
  mainWindow = window;
  log.info('=== Manual Updater Initialized ===');
  log.info('Current version:', app.getVersion());
  log.info('Latest version:', LATEST_VERSION);
}

function checkForUpdates() {
  const currentVersion = app.getVersion();
  const currentParts = currentVersion.split('.').map(Number);
  const latestParts = LATEST_VERSION.split('.').map(Number);
  
  log.info('Current:', currentVersion, 'Latest:', LATEST_VERSION);
  
  let isUpdateAvailable = false;
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const curr = currentParts[i] || 0;
    const latest = latestParts[i] || 0;
    if (latest > curr) {
      isUpdateAvailable = true;
      break;
    } else if (latest < curr) {
      isUpdateAvailable = false;
      break;
    }
  }
  
  if (isUpdateAvailable) {
    log.info('Update available:', LATEST_VERSION);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', {
        version: LATEST_VERSION,
        releaseNotes: 'Nuova versione disponibile'
      });
    }
  } else {
    log.info('No updates available');
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available');
    }
  }
}

function downloadUpdate() {
  log.info('Download update - opens GitHub releases');
  const { shell } = require('electron');
  shell.openExternal('https://github.com/zak066/pipenewsgenerator/releases');
}

function installUpdate() {
  log.info('Install update - not automatic, user must download manually');
}

module.exports = {
  initAutoUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate
};