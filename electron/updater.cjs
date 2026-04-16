const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { app } = require('electron');

let mainWindow = null;

function initAutoUpdater(window) {
  mainWindow = window;
  
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'debug';
  
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.currentVersion = app.getVersion();
  
  autoUpdater.feedURL = 'https://github.com/zak066/pipenewsgenerator/releases/latest';
  
  log.info('=== AutoUpdater Debug ===');
  log.info('Current version:', autoUpdater.currentVersion);
  log.info('Feed URL:', autoUpdater.feedURL);
  log.info('App path:', app.getAppPath());
  log.info('============================');
  
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
  });
  
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', {
        version: info.version,
        releaseNotes: info.releaseNotes
      });
    }
  });
  
  autoUpdater.on('update-not-available', () => {
    log.info('No updates available');
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available');
    }
  });
  
  autoUpdater.on('download-progress', (progress) => {
    log.info('Download progress:', progress.percent);
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total
      });
    }
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', {
        version: info.version
      });
    }
  });
  
  autoUpdater.on('error', (err) => {
    log.error('AutoUpdater error:', err.message);
  });
  
  autoUpdater.on('full-log', (text) => {
    log.info('Full log:', text);
  });
}

function checkForUpdates() {
  autoUpdater.checkForUpdates().catch(err => {
    log.error('Error checking for updates:', err.message);
  });
}

function downloadUpdate() {
  autoUpdater.downloadUpdate().catch(err => {
    log.error('Error downloading update:', err);
  });
}

function installUpdate() {
  autoUpdater.quitAndInstall(false, true);
}

module.exports = {
  initAutoUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate
};