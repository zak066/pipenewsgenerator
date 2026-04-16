const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const log = require('electron-log');
const { initDatabase, getDb } = require('./database.cjs');
const { generateBitlyLink, convertToTinyUrl, testLink } = require('./bitly.cjs');
const { generateFile } = require('./fileGenerator.cjs');
const { initAutoUpdater, checkForUpdates, downloadUpdate, installUpdate } = require('./updater.cjs');

log.initialize();
log.transports.file.level = 'info';
log.info('App starting...');

let mainWindow = null;

function createWindow() {
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

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    initAutoUpdater(mainWindow);
  }

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

ipcMain.handle('get-marchi', () => {
  try {
    const db = getDb();
    if (!db) return [];
    return db.prepare('SELECT * FROM marchi ORDER BY nome').all();
  } catch (err) {
    log.error('Error getting marchi:', err);
    return [];
  }
});

ipcMain.handle('add-marchio', (_, marchio) => {
  try {
    const db = getDb();
    if (!db) return { error: 'Database not initialized' };
    const stmt = db.prepare('INSERT INTO marchi (nome, link_ita, link_eng) VALUES (?, ?, ?)');
    const result = stmt.run(marchio.nome, marchio.link_ita, marchio.link_eng);
    return { id: result.lastInsertRowid, ...marchio };
  } catch (err) {
    log.error('Error adding marchio:', err);
    return { error: err.message };
  }
});

ipcMain.handle('update-marchio', (_, marchio) => {
  try {
    const db = getDb();
    if (!db) return { error: 'Database not initialized' };
    const stmt = db.prepare('UPDATE marchi SET nome = ?, link_ita = ?, link_eng = ? WHERE id = ?');
    stmt.run(marchio.nome, marchio.link_ita, marchio.link_eng, marchio.id);
    return marchio;
  } catch (err) {
    log.error('Error updating marchio:', err);
    return { error: err.message };
  }
});

ipcMain.handle('delete-marchio', (_, id) => {
  try {
    const db = getDb();
    if (!db) return { error: 'Database not initialized' };
    db.prepare('DELETE FROM marchi WHERE id = ?').run(id);
    return { success: true };
  } catch (err) {
    log.error('Error deleting marchio:', err);
    return { error: err.message };
  }
});

ipcMain.handle('generate-bitly', async (_, url) => {
  return await generateBitlyLink(url);
});

ipcMain.handle('convert-tinyurl', async (_, url) => {
  return await convertToTinyUrl(url);
});

ipcMain.handle('test-link', async (_, url) => {
  return await testLink(url);
});

ipcMain.handle('get-settings', () => {
  try {
    const db = getDb();
    if (!db) return {};
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(row => { settings[row.key] = row.value; });
    return settings;
  } catch (err) {
    log.error('Error getting settings:', err);
    return {};
  }
});

ipcMain.handle('set-setting', (_, key, value) => {
  try {
    const db = getDb();
    if (!db) return { error: 'Database not initialized' };
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    return { success: true };
  } catch (err) {
    log.error('Error setting value:', err);
    return { error: err.message };
  }
});
  return { success: true };
});

ipcMain.handle('get-templates', () => {
  try {
    const db = getDb();
    if (!db) return null;
    return db.prepare('SELECT * FROM templates WHERE is_default = 1').get();
  } catch (err) {
    log.error('Error getting templates:', err);
    return null;
  }
});

ipcMain.handle('save-templates', (_, templates) => {
  try {
    const db = getDb();
    if (!db) return { error: 'Database not initialized' };
    db.prepare('DELETE FROM templates WHERE is_default = 1').run();
    db.prepare('INSERT INTO templates (nome, header_ita, header_eng, footer_ita, footer_eng, is_default) VALUES (?, ?, ?, ?, ?, 1)')
      .run('default', templates.header_ita, templates.header_eng, templates.footer_ita, templates.footer_eng);
    return { success: true };
  } catch (err) {
    log.error('Error saving templates:', err);
    return { error: err.message };
  }
});

ipcMain.handle('generate-files', async (_, data) => {
  return await generateFile(data);
});

ipcMain.handle('save-file', async (_, { filename, content }) => {
  const { dialog } = require('electron');
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });
  if (!result.canceled && result.filePath) {
    require('fs').writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

ipcMain.handle('export-marchi', async () => {
  try {
    const db = getDb();
    if (!db) return { error: 'Database not initialized' };
    const marchi = db.prepare('SELECT nome, link_ita, link_eng FROM marchi ORDER BY nome').all();
    
    let itaContent = '';
    let engContent = '';
    
    marchi.forEach(m => {
      itaContent += '_' + m.nome + '_\n' + (m.link_ita || '') + '\n\n';
      engContent += '_' + m.nome + '_\n' + (m.link_eng || '') + '\n\n';
    });
    
    return {
      ita: itaContent,
      eng: engContent,
      filenameIta: 'Elenco Link ITA.txt',
      filenameEng: 'Elenco Link ENG.txt'
    };
  } catch (err) {
    log.error('Error exporting marchi:', err);
    return { error: err.message };
  }
});
  };
});

ipcMain.handle('open-external', async (_, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    log.error('Error opening external URL:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('check-for-updates', () => {
  checkForUpdates();
  return { success: true };
});

ipcMain.handle('download-update', () => {
  downloadUpdate();
  return { success: true };
});

ipcMain.handle('install-update', () => {
  installUpdate();
  return { success: true };
});