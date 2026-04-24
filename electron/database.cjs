const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const log = require('electron-log');
const config = require('./config.cjs');

let db;

function initTables(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS ${config.tables.marchi} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      link_ita TEXT,
      link_eng TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS ${config.tables.templates} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      header_ita TEXT,
      header_eng TEXT,
      footer_ita TEXT,
      footer_eng TEXT,
      is_default INTEGER DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS ${config.tables.settings} (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  
  const defaultHeaderIta = 'Non perderti i *nostri ultimi arrivi!*\n\n*pipe nuove*';
  const defaultHeaderEng = 'Don\'t miss out *our new arrivals!*\n\n*unsmoked pipes*';
  const defaultFooterIta = 'Ti ricordo che puoi cancellare l\'iscrizione a questa lista in qualsiasi momento mandando un messaggio con scritto "CANCELLAMI".\n\nNon esitare a contattarmi per qualsiasi ulteriore dettaglio.\n\nSaluti,\nMarco Novelli\nwww.novelli.it';
  const defaultFooterEng = 'You can unsuscribe at any time sending the message UNSUSCRIBE\nPlease feel free to contact me for any further information.\n\nBest Regards,\nMarco Novelli\nwww.novelli.it';
  
  database.prepare(`INSERT INTO ${config.tables.templates} (nome, header_ita, header_eng, footer_ita, footer_eng, is_default) VALUES (?, ?, ?, ?, ?, 1)`)
    .run('default', defaultHeaderIta, defaultHeaderEng, defaultFooterIta, defaultFooterEng);
}

function initDatabase() {
  config.db.ensureFolder();
  
  const dbPath = config.db.getPath();
  log.info('Database path:', dbPath);
  
  if (app.isPackaged && !fs.existsSync(dbPath)) {
    const oldDbPath = path.join(app.getPath('userData'), config.db.filename);
    if (fs.existsSync(oldDbPath)) {
      log.info('Migrating database from:', oldDbPath);
      try {
        const oldDb = new Database(oldDbPath, { readonly: true });
        const oldMarchi = oldDb.prepare(`SELECT * FROM ${config.tables.marchi}`).all();
        const oldTemplates = oldDb.prepare(`SELECT * FROM ${config.tables.templates}`).all();
        const oldSettings = oldDb.prepare(`SELECT * FROM ${config.tables.settings}`).all();
        oldDb.close();
        
        db = new Database(dbPath);
        initTables(db);
        
        if (oldMarchi.length > 0) {
          const insertMarchi = db.prepare(`INSERT INTO ${config.tables.marchi} (nome, link_ita, link_eng) VALUES (?, ?, ?)`);
          oldMarchi.forEach(m => insertMarchi.run(m.nome, m.link_ita, m.link_eng));
        }
        
        if (oldTemplates.length > 0) {
          db.prepare(`DELETE FROM ${config.tables.templates}`).run();
          const insertTemplates = db.prepare(`INSERT INTO ${config.tables.templates} (nome, header_ita, header_eng, footer_ita, footer_eng, is_default) VALUES (?, ?, ?, ?, ?, ?)`);
          oldTemplates.forEach(t => insertTemplates.run(t.nome, t.header_ita, t.header_eng, t.footer_ita, t.footer_eng, t.is_default));
        }
        
        if (oldSettings.length > 0) {
          const insertSettings = db.prepare(`INSERT OR REPLACE INTO ${config.tables.settings} (key, value) VALUES (?, ?)`);
          oldSettings.forEach(s => insertSettings.run(s.key, s.value));
        }
        
        log.info('Database migrated successfully');
      } catch (err) {
        log.error('Migration failed:', err);
        db = new Database(dbPath);
        initTables(db);
      }
    } else {
      db = new Database(dbPath);
      initTables(db);
    }
  } else {
    db = new Database(dbPath);
    initTables(db);
  }
  
  log.info('Tables initialized, checking data...');
  
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${config.tables.marchi}`).get();
  log.info('Marchi count:', count.count);
  
  if (count.count === 0) {
    log.info('No marchi found, importing initial data...');
    importInitialData();
  } else {
    const engCheck = db.prepare(`SELECT link_eng FROM ${config.tables.marchi} WHERE link_eng IS NOT NULL AND link_eng != "" LIMIT 1`).get();
    if (!engCheck) {
      log.warn('English links missing, updating...');
      reimportEngLinks();
    }
  }
  
  const templateCount = db.prepare(`SELECT COUNT(*) as count FROM ${config.tables.templates} WHERE is_default = 1`).get();
  log.info('Templates count:', templateCount.count);
  
  if (templateCount.count === 0) {
    const defaultHeaderIta = 'Non perderti i *nostri ultimi arrivi!*\n\n*pipe nuove*';
    const defaultHeaderEng = 'Don\'t miss out *our new arrivals!*\n\n*unsmoked pipes*';
    const defaultFooterIta = 'Ti ricordo che puoi cancellare l\'iscrizione a questa lista in qualsiasi momento mandando un messaggio con scritto "CANCELLAMI".\n\nNon esitare a contattarmi per qualsiasi ulteriore dettaglio.\n\nSaluti,\nMarco Novelli\nwww.novelli.it';
    const defaultFooterEng = 'You can unsuscribe at any time sending the message UNSUSCRIBE\nPlease feel free to contact me for any further information.\n\nBest Regards,\nMarco Novelli\nwww.novelli.it';
    
    db.prepare(`INSERT INTO ${config.tables.templates} (nome, header_ita, header_eng, footer_ita, footer_eng, is_default) VALUES (?, ?, ?, ?, ?, 1)`)
      .run('default', defaultHeaderIta, defaultHeaderEng, defaultFooterIta, defaultFooterEng);
  }
  
  return db;
}

function parseLinks(content) {
  const map = new Map();
  const lines = content.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  for (let i = 0; i < lines.length; i += 2) {
    const line = lines[i];
    if (line && line.startsWith('_') && line.endsWith('_') && i + 1 < lines.length) {
      const nome = line.replace(/^_|_$/g, '').trim();
      const link = lines[i + 1].trim();
      if (nome && link) {
        map.set(nome, link);
      }
    }
  }
  
  return map;
}

function importInitialData() {
  const repoPath = config.repository.path;
  
  try {
    const itaContent = fs.readFileSync(path.join(repoPath, 'Elenco Link ITA.txt'), 'utf-8');
    const engContent = fs.readFileSync(path.join(repoPath, 'Elenco Link ENG.txt'), 'utf-8');
    
    const itaMap = parseLinks(itaContent);
    const engMap = parseLinks(engContent);
    
    const insertStmt = db.prepare(`INSERT INTO ${config.tables.marchi} (nome, link_ita, link_eng) VALUES (?, ?, ?)`);
    
    const transaction = db.transaction(() => {
      itaMap.forEach((linkIta, nome) => {
        const linkEng = engMap.get(nome) || '';
        insertStmt.run(nome, linkIta, linkEng);
      });
    });
    
    transaction();
    
    log.info('Imported ' + itaMap.size + ' marchi');
  } catch (err) {
    log.warn('Could not import initial data:', err);
  }
}

function reimportEngLinks() {
  const repoPath = config.repository.path;
  
  try {
    const engContent = fs.readFileSync(path.join(repoPath, 'Elenco Link ENG.txt'), 'utf-8');
    const engMap = parseLinks(engContent);
    
    const updateStmt = db.prepare(`UPDATE ${config.tables.marchi} SET link_eng = ? WHERE nome = ?`);
    
    const transaction = db.transaction(() => {
      engMap.forEach((linkEng, nome) => {
        updateStmt.run(linkEng, nome);
      });
    });
    
    transaction();
    
    log.info('Updated ' + engMap.size + ' English links');
  } catch (err) {
    log.warn('Could not reimport English links:', err);
  }
}

function getDb() {
  return db;
}

function batchInsertMarchi(marchi) {
  if (!db || !marchi || marchi.length === 0) return;
  
  const insertStmt = db.prepare(`INSERT INTO ${config.tables.marchi} (nome, link_ita, link_eng) VALUES (?, ?, ?)`);
  
  const transaction = db.transaction(() => {
    for (const m of marchi) {
      insertStmt.run(m.nome, m.link_ita || null, m.link_eng || null);
    }
  });
  
  transaction();
}

module.exports = { 
  initDatabase, 
  getDb,
  batchInsertMarchi,
  parseLinks
};