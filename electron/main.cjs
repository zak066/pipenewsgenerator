const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const { initDatabase, getDb } = require('./database.cjs');
const { generateBitlyLink, testLink } = require('./bitly.cjs');
const { generateFile } = require('./fileGenerator.cjs');

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
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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
  const db = getDb();
  return db.prepare('SELECT * FROM marchi ORDER BY nome').all();
});

ipcMain.handle('add-marchio', (_, marchio) => {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO marchi (nome, link_ita, link_eng) VALUES (?, ?, ?)');
  const result = stmt.run(marchio.nome, marchio.link_ita, marchio.link_eng);
  return { id: result.lastInsertRowid, ...marchio };
});

ipcMain.handle('update-marchio', (_, marchio) => {
  const db = getDb();
  const stmt = db.prepare('UPDATE marchi SET nome = ?, link_ita = ?, link_eng = ? WHERE id = ?');
  stmt.run(marchio.nome, marchio.link_ita, marchio.link_eng, marchio.id);
  return marchio;
});

ipcMain.handle('delete-marchio', (_, id) => {
  const db = getDb();
  db.prepare('DELETE FROM marchi WHERE id = ?').run(id);
  return { success: true };
});

ipcMain.handle('generate-bitly', async (_, url) => {
  return await generateBitlyLink(url);
});

ipcMain.handle('test-link', async (_, url) => {
  return await testLink(url);
});

ipcMain.handle('get-settings', () => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(row => { settings[row.key] = row.value; });
  return settings;
});

ipcMain.handle('set-setting', (_, key, value) => {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  return { success: true };
});

ipcMain.handle('get-templates', () => {
  const db = getDb();
  return db.prepare('SELECT * FROM templates WHERE is_default = 1').get();
});

ipcMain.handle('save-templates', (_, templates) => {
  const db = getDb();
  db.prepare('DELETE FROM templates WHERE is_default = 1').run();
  db.prepare('INSERT INTO templates (nome, header_ita, header_eng, footer_ita, footer_eng, is_default) VALUES (?, ?, ?, ?, ?, 1)')
    .run('default', templates.header_ita, templates.header_eng, templates.footer_ita, templates.footer_eng);
  return { success: true };
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
  const db = getDb();
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
});