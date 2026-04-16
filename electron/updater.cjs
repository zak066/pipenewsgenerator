const log = require('electron-log');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function initAutoUpdater(window) {
  mainWindow = window;
  log.info('=== Manual Updater Initialized ===');
  log.info('Current version:', app.getVersion());
}

function getLatestVersion() {
  try {
    const resourcesPath = process.resourcesPath;
    const latestYamlPath = path.join(resourcesPath, 'latest-linux.yml');
    log.info('Looking for latest-linux.yml at:', latestYamlPath);
    
    if (!fs.existsSync(latestYamlPath)) {
      log.info('latest-linux.yml not found');
      return null;
    }
    
    const content = fs.readFileSync(latestYamlPath, 'utf8');
    const match = content.match(/version:\s*([0-9.]+)/);
    if (match) {
      const latestVersion = match[1];
      log.info('Latest version from file:', latestVersion);
      return latestVersion;
    }
  } catch (e) {
    log.error('Error reading latest-linux.yml:', e.message);
  }
  return null;
}

function checkForUpdates() {
  const currentVersion = app.getVersion();
  const latestVersion = getLatestVersion();
  
  log.info('Current:', currentVersion, 'Latest:', latestVersion);
  
  if (!latestVersion) {
    log.error('Could not determine latest version');
    if (mainWindow) {
      mainWindow.webContents.send('update-error', { message: 'Impossibile verificare gli aggiornamenti' });
    }
    return;
  }
  
  const currentParts = currentVersion.split('.').map(Number);
  const latestParts = latestVersion.split('.').map(Number);
  
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
    log.info('Update available:', latestVersion);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', {
        version: latestVersion,
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
  log.info('Download update clicked - not implemented for local updates');
}

function installUpdate() {
  log.info('Install update clicked - not implemented for local updates');
}

module.exports = {
  initAutoUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate
};