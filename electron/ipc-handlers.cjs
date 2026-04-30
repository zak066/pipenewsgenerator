const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const { getDb } = require('./database.cjs');
const { generateBitlyLink, convertToTinyUrl, testLink } = require('./bitly.cjs');
const { initAutoUpdater, checkForUpdates, downloadUpdate, installUpdate } = require('./updater.cjs');
const config = require('./config.cjs');
const { validateMarchio, validateId, validateFilename, sanitizeString, schemas } = require('./validation.cjs');
const { ValidationError, DatabaseError, isAppError, wrapError } = require('./errors.cjs');


function generateFile(data) {
  if (!data || !data.marchi || !Array.isArray(data.marchi)) {
    throw new ValidationError('Dati non validi');
  }
  
  const { marchi, templates } = data;
  const header_ita = templates.header_ita || '';
  const header_eng = templates.header_eng || '';
  const footer_ita = templates.footer_ita || '';
  const footer_eng = templates.footer_eng || '';
  
  let itaContent = `${header_ita}\n\n`;
  let engContent = `${header_eng}\n\n`;
  
  marchi.forEach(m => {
    itaContent += `_${m.nome}_\n${m.link_ita || ''}\n\n`;
    engContent += `_${m.nome}_\n${m.link_eng || ''}\n\n`;
  });
  
  itaContent += footer_ita;
  engContent += footer_eng;
  
  return {
    ita: itaContent,
    eng: engContent,
    filenameIta: 'pipe-ita.txt',
    filenameEng: 'pipe-en.txt'
  };
}

function registerHandlers(mainWindow) {
  function handleError(err, operation) {
    if (isAppError(err)) {
      return err.toJSON();
    }
    return { error: err.message || 'Errore inatteso' };
  }

  ipcMain.handle('get-marchi', () => {
    try {
      const db = getDb();
      if (!db) throw new DatabaseError('Database non inizializzato');
      return db.prepare(`SELECT * FROM ${config.tables.marchi} ORDER BY nome`).all();
    } catch (err) {
      return handleError(err, 'get-marchi');
    }
  });

  ipcMain.handle('add-marchio', (_, data) => {
    try {
      const db = getDb();
      if (!db) throw new DatabaseError('Database non inizializzato');
      
      const result = validateMarchio(data);
      if (!result.success) {
        throw result.error;
      }
      
      const { nome, link_ita, link_eng } = result.data;
      const stmt = db.prepare(`INSERT INTO ${config.tables.marchi} (nome, link_ita, link_eng) VALUES (?, ?, ?)`);
      const insertResult = stmt.run(nome, link_ita, link_eng);
      
      return { id: insertResult.lastInsertRowid, nome, link_ita, link_eng };
    } catch (err) {
      return handleError(err, 'add-marchio');
    }
  });

  ipcMain.handle('update-marchio', (_, data) => {
    try {
      const db = getDb();
      if (!db) throw new DatabaseError('Database non inizializzato');
      
      const id = validateId(data.id, 'ID marchio');
      
      const result = validateMarchio(data);
      if (!result.success) {
        throw result.error;
      }
      
      const { nome, link_ita, link_eng } = result.data;
      
      db.prepare(`UPDATE ${config.tables.marchi} SET nome = ?, link_ita = ?, link_eng = ? WHERE id = ?`)
        .run(nome, link_ita, link_eng, id);
      
      return { id, nome, link_ita, link_eng };
    } catch (err) {
      return handleError(err, 'update-marchio');
    }
  });

  ipcMain.handle('delete-marchio', (_, id) => {
    try {
      const db = getDb();
      if (!db) throw new DatabaseError('Database non inizializzato');
      
      const numId = validateId(id, 'ID marchio');
      db.prepare(`DELETE FROM ${config.tables.marchi} WHERE id = ?`).run(numId);
      
      return { success: true };
    } catch (err) {
      return handleError(err, 'delete-marchio');
    }
  });

  ipcMain.handle('generate-bitly', async (_, url) => {
    try {
      const validatedUrl = schemas.url.parse(url);
      return await generateBitlyLink(validatedUrl);
    } catch (err) {
      return { shortLink: '', error: err.message };
    }
  });

  ipcMain.handle('convert-tinyurl', async (_, url) => {
    try {
      const validatedUrl = schemas.url.parse(url);
      return await convertToTinyUrl(validatedUrl);
    } catch (err) {
      return { shortLink: '', error: err.message };
    }
  });

  ipcMain.handle('test-link', async (_, url) => {
    try {
      return await testLink(url);
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  });

  ipcMain.handle('get-settings', () => {
    try {
      const db = getDb();
      if (!db) return {};
      const rows = db.prepare(`SELECT key, value FROM ${config.tables.settings}`).all();
      const settings = {};
      rows.forEach(row => { settings[row.key] = row.value; });
      return settings;
    } catch (err) {
      return handleError(err, 'get-settings');
    }
  });

  ipcMain.handle('set-setting', (_, key, value) => {
    try {
      const db = getDb();
      if (!db) throw new DatabaseError('Database non inizializzato');
      
      const validatedKey = validateSettings.key.parse(key);
      const validatedValue = validateSettings.value.parse(value);
      
      if (key === 'bitly_token' || key === 'tinyurl_token') {
        clearTokenCache();
      }
      
      db.prepare(`INSERT OR REPLACE INTO ${config.tables.settings} (key, value) VALUES (?, ?)`)
        .run(validatedKey, validatedValue);
      
      return { success: true };
    } catch (err) {
      return handleError(err, 'set-setting');
    }
  });

  ipcMain.handle('get-templates', () => {
    try {
      const db = getDb();
      if (!db) return null;
      return db.prepare(`SELECT * FROM ${config.tables.templates} WHERE is_default = 1`).get();
    } catch (err) {
      return handleError(err, 'get-templates');
    }
  });

  ipcMain.handle('save-templates', (_, data) => {
    try {
      const db = getDb();
      if (!db) throw new DatabaseError('Database non inizializzato');
      
      const validated = validateTemplates.parse(data);
      
      db.prepare(`DELETE FROM ${config.tables.templates} WHERE is_default = 1`).run();
      db.prepare(`INSERT INTO ${config.tables.templates} (nome, header_ita, header_eng, footer_ita, footer_eng, is_default) VALUES (?, ?, ?, ?, ?, 1)`)
        .run('default', validated.header_ita, validated.header_eng, validated.footer_ita, validated.footer_eng);
      
      return { success: true };
    } catch (err) {
      return handleError(err, 'save-templates');
    }
  });

  ipcMain.handle('generate-files', async (_, data) => {
    try {
      if (!data || !data.marchi || !Array.isArray(data.marchi)) {
        throw new ValidationError('Dati non validi');
      }
      return await generateFile(data);
    } catch (err) {
      return handleError(err, 'generate-files');
    }
  });

  ipcMain.handle('save-file', async (_, data) => {
    try {
      const { dialog } = require('electron');
      const filename = validateFilename(data.filename);
      const content = sanitizeString(data.content, 1000000);
      
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: filename,
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
      });
      
      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, content, 'utf-8');
        return { success: true, path: result.filePath };
      }
      return { success: false };
    } catch (err) {
      return handleError(err, 'save-file');
    }
  });

  ipcMain.handle('resolve-urls', async (_, urls) => {
    try {
      const { resolveShortUrl } = require('./bitly.cjs');
      const resolved = [];
      for (const url of urls) {
        if (!url) {
          resolved.push('');
          continue;
        }
        const realUrl = await resolveShortUrl(url);
        resolved.push(realUrl);
      }
      return { success: true, urls: resolved };
    } catch (err) {
      return handleError(err, 'resolve-urls');
    }
  });

  ipcMain.handle('export-marchi', async () => {
    try {
      const db = getDb();
      if (!db) throw new DatabaseError('Database non inizializzato');
      
      const marchi = db.prepare(`SELECT nome, link_ita, link_eng FROM ${config.tables.marchi} ORDER BY nome`).all();
      
      let itaContent = '';
      let engContent = '';
      
      marchi.forEach(m => {
        itaContent += '_' + m.nome + '_\n' + (m.link_ita || '') + '\n\n';
        engContent += '_' + m.nome + '_\n' + (m.link_eng || '') + '\n\n';
      });
      
      return {
        ita: itaContent,
        eng: engContent,
        filenameIta: config.output.filenames.exportIta,
        filenameEng: config.output.filenames.exportEng
      };
    } catch (err) {
      return handleError(err, 'export-marchi');
    }
  });

  ipcMain.handle('open-external', async (_, url) => {
    try {
      const validatedUrl = schemas.url.parse(url);
      await shell.openExternal(validatedUrl);
      return { success: true };
    } catch (err) {
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

  ipcMain.handle('backup-database', async () => {
    try {
      const { dialog } = require('electron');
      const db = getDb();
      if (!db) {
        return { success: false, error: 'Database non inizializzato' };
      }
      
      if (!mainWindow) {
        return { success: false, error: 'Finestra non disponibile' };
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const defaultFilename = `pipe-link-backup-${timestamp}.sql`;
      
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Salva Backup Database',
        defaultPath: defaultFilename,
        filters: [
          { name: 'SQL Files', extensions: ['sql'] },
          { name: 'Tutti i file', extensions: ['*'] }
        ]
      });
      
      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }
      
      const backupDate = new Date().toISOString().replace('T', ' ').slice(0, 19);
      let sqlContent = `-- Backup Pipe Link Generator\n`;
      sqlContent += `-- Data: ${backupDate}\n\n`;
      
      const marchi = db.prepare(`SELECT * FROM ${config.tables.marchi}`).all();
      if (marchi.length > 0) {
        sqlContent += `-- Dump marchi\n`;
        sqlContent += `DELETE FROM ${config.tables.marchi};\n\n`;
        marchi.forEach(m => {
          const nome = (m.nome || '').replace(/'/g, "''");
          const link_ita = (m.link_ita || '').replace(/'/g, "''");
          const link_eng = (m.link_eng || '').replace(/'/g, "''");
          sqlContent += `INSERT INTO ${config.tables.marchi} (id, nome, link_ita, link_eng, created_at) VALUES (${m.id}, '${nome}', '${link_ita}', '${link_eng}', '${m.created_at || ''}');\n`;
        });
        sqlContent += `\n`;
      }
      
      const templates = db.prepare(`SELECT * FROM ${config.tables.templates}`).all();
      if (templates.length > 0) {
        sqlContent += `-- Dump templates\n`;
        sqlContent += `DELETE FROM ${config.tables.templates};\n\n`;
        templates.forEach(t => {
          const nome = (t.nome || '').replace(/'/g, "''");
          const header_ita = (t.header_ita || '').replace(/'/g, "''");
          const header_eng = (t.header_eng || '').replace(/'/g, "''");
          const footer_ita = (t.footer_ita || '').replace(/'/g, "''");
          const footer_eng = (t.footer_eng || '').replace(/'/g, "''");
          sqlContent += `INSERT INTO ${config.tables.templates} (id, nome, header_ita, header_eng, footer_ita, footer_eng, is_default) VALUES (${t.id}, '${nome}', '${header_ita}', '${header_eng}', '${footer_ita}', '${footer_eng}', ${t.is_default});\n`;
        });
        sqlContent += `\n`;
      }
      
      const settings = db.prepare(`SELECT * FROM ${config.tables.settings}`).all();
      if (settings.length > 0) {
        sqlContent += `-- Dump settings\n`;
        sqlContent += `DELETE FROM ${config.tables.settings};\n\n`;
        settings.forEach(s => {
          const key = (s.key || '').replace(/'/g, "''");
          const value = (s.value || '').replace(/'/g, "''");
          sqlContent += `INSERT INTO ${config.tables.settings} (key, value) VALUES ('${key}', '${value}');\n`;
        });
        sqlContent += `\n`;
      }
      
      fs.writeFileSync(result.filePath, sqlContent, 'utf-8');
      
      return { success: true, path: result.filePath };
    } catch (err) {
      return handleError(err, 'backup-database');
    }
  });

  ipcMain.handle('restore-database', async () => {
    try {
      const { dialog } = require('electron');
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Seleziona Backup da Ripristinare',
        filters: [
          { name: 'SQL Files', extensions: ['sql'] },
          { name: 'Tutti i file', extensions: ['*'] }
        ],
        properties: ['openFile']
      });
      
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }
      
      const backupPath = result.filePaths[0];
      const content = fs.readFileSync(backupPath, 'utf-8');
      
      if (!content.includes('-- Backup Pipe Link Generator')) {
        return { success: false, error: 'Il file selezionato non è un backup valido' };
      }
      
      const db = getDb();
      if (!db) throw new DatabaseError('Database non inizializzato');
      
      db.exec('BEGIN TRANSACTION');
      
      try {
        const statements = content.split(';').filter(s => s.trim());
       
        for (const statement of statements) {
          const trimmed = statement.trim();
          if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*')) {
            db.exec(trimmed);
          }
        }
        
        db.exec('COMMIT');
        
        return { success: true, path: backupPath };
      } catch (execErr) {
        db.exec('ROLLBACK');
        throw execErr;
      }
    } catch (err) {
      return handleError(err, 'restore-database');
    }
  });
}

module.exports = { registerHandlers };
