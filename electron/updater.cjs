const log = require('electron-log');
const { app, net } = require('electron');

let mainWindow = null;
const GITHUB_OWNER = 'zak066';
const GITHUB_REPO = 'pipenewsgenerator';

function initAutoUpdater(window) {
  mainWindow = window;
  log.info('=== Manual Updater Initialized ===');
  log.info('Current version:', app.getVersion());
}

function checkForUpdates() {
  log.info('Checking for updates from GitHub...');
  
  const request = net.request({
    method: 'GET',
    protocol: 'https:',
    hostname: 'api.github.com',
    path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
  });
  
  request.setHeader('User-Agent', 'Pipe-Link-Generator');
  
  let responseData = '';
  
  request.on('response', (response) => {
    response.on('data', (chunk) => {
      responseData += chunk;
    });
    
    response.on('end', () => {
      try {
        if (response.statusCode === 200) {
          const release = JSON.parse(responseData);
          const latestVersion = release.tag_name?.replace('v', '') || '0.0.0';
          log.info('GitHub latest version:', latestVersion);
          compareVersions(latestVersion);
        } else {
          log.error('GitHub API error:', response.statusCode);
          if (mainWindow) {
            mainWindow.webContents.send('update-error', { message: 'Errore verifica aggiornamenti (HTTP ' + response.statusCode + ')' });
          }
        }
      } catch (e) {
        log.error('Error parsing GitHub response:', e.message);
        if (mainWindow) {
          mainWindow.webContents.send('update-error', { message: 'Errore parsing risposta GitHub' });
        }
      }
    });
  });
  
  request.on('error', (err) => {
    log.error('Network error:', err.message);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', { message: 'Errore di rete: ' + err.message });
    }
  });
  
  request.end();
}

function compareVersions(latestVersion) {
  const currentVersion = app.getVersion();
  const currentParts = currentVersion.split('.').map(Number);
  const latestParts = latestVersion.split('.').map(Number);
  
  log.info('Current:', currentVersion, 'Latest:', latestVersion);
  
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
  log.info('Opening GitHub releases...');
  const { shell } = require('electron');
  shell.openExternal(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`);
}

function installUpdate() {
  downloadUpdate();
}

module.exports = {
  initAutoUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate
};