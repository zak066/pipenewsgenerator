const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function initAutoUpdater(window) {
  mainWindow = window;
  
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'debug';
  
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.currentVersion = app.getVersion();
  
  const resourcesPath = process.resourcesPath || app.getAppPath();
  const latestYamlPath = path.join(resourcesPath, 'latest-linux.yml');
  log.info('Latest yaml path:', latestYamlPath);
  
  if (fs.existsSync(latestYamlPath)) {
    try {
      const yamlContent = fs.readFileSync(latestYamlPath, 'utf8');
      const updateInfo = parseYaml(yamlContent);
      autoUpdater.updateInfo = updateInfo;
      log.info('Loaded local update info:', updateInfo);
    } catch (e) {
      log.info('Could not load local yaml:', e.message);
    }
  } else {
    log.info('latest-linux.yml not found at:', latestYamlPath);
  }
  
  log.info('=== AutoUpdater Debug ===');
  log.info('Current version:', autoUpdater.currentVersion);
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
}

function parseYaml(content) {
  const result = {};
  content.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      result[key] = value;
    }
  });
  return result;
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