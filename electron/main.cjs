const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const { initDatabase, getDb } = require('./database.cjs');
const { registerHandlers } = require('./ipc-handlers.cjs');
const { initAutoUpdater } = require('./updater.cjs');

log.initialize();
log.transports.file.level = 'info';

let mainWindow = null;

function createWindow() {
  log.info('Creating window...');  
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Pipe Link Generator',
    webContents: {
      setWindowOpenHandler: ({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
  });

  // Register IPC handlers
  registerHandlers(mainWindow);

  const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
  log.info('HTML path:', htmlPath);
  log.info('HTML exists:', fs.existsSync(htmlPath));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(htmlPath).catch(err => {
      log.error('Failed to load HTML:', err);
    });
    initAutoUpdater(mainWindow);
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error('Page failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  try {
    initDatabase();
    log.info('Database initialized');
  } catch (err) {
    log.error('Failed to initialize database:', err);
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
