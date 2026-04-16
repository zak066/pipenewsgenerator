const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const log = require('electron-log');

let db;

function initTables(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS marchi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      link_ita TEXT,
      link_eng TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      header_ita TEXT,
      header_eng TEXT,
      footer_ita TEXT,
      footer_eng TEXT,
      is_default INTEGER DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  
  database.prepare('INSERT INTO templates (nome, header_ita, header_eng, footer_ita, footer_eng, is_default) VALUES (?, ?, ?, ?, ?, 1)')
    .run('default', 
      'Non perderti i *nostri ultimi arrivi!*\n\n*pipe nuove*',
      'Don\'t miss out *our new arrivals!*\n\n*unsmoked pipes*',
      'Ti ricordo che puoi cancellare l\'iscrizione a questa lista in qualsiasi momento mandando un messaggio con scritto "CANCELLAMI".\n\nNon esitare a contattarmi per qualsiasi ulteriore dettaglio.\n\nSaluti,\nMarco Novelli\nwww.novelli.it',
      'You can unsuscribe at any time sending the message UNSUSCRIBE\nPlease feel free to contact me for any further information.\n\nBest Regards,\nMarco Novelli\nwww.novelli.it');
}

function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'pipe-link.db');
  log.info('Database path:', dbPath);
  
  const fs = require('fs');
  
  db = new Database(dbPath);
  
  initTables(db);

  const count = db.prepare('SELECT COUNT(*) as count FROM marchi').get();
  if (count.count === 0) {
    importInitialData();
  } else {
    const engCheck = db.prepare('SELECT link_eng FROM marchi WHERE link_eng IS NOT NULL AND link_eng != "" LIMIT 1').get();
    if (!engCheck) {
      log.warn('English links missing, updating...');
      reimportEngLinks();
    }
  }
  
  const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates WHERE is_default = 1').get();
  if (templateCount.count === 0) {
    db.prepare('INSERT INTO templates (nome, header_ita, header_eng, footer_ita, footer_eng, is_default) VALUES (?, ?, ?, ?, ?, 1)')
      .run('default', 
        'Non perderti i *nostri ultimi arrivi!*\n\n*pipe nuove*',
        'Don\'t miss out *our new arrivals!*\n\n*unsmoked pipes*',
        'Ti ricordo che puoi cancellare l\'iscrizione a questa lista in qualsiasi momento mandando un messaggio con scritto "CANCELLAMI".\n\nNon esitare a contattarmi per qualsiasi ulteriore dettaglio.\n\nSaluti,\nMarco Novelli\nwww.novelli.it',
        'You can unsuscribe at any time sending the message UNSUSCRIBE\nPlease feel free to contact me for any further information.\n\nBest Regards,\nMarco Novelli\nwww.novelli.it');
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
  const repoPath = path.join(__dirname, '..', 'repository');
  const fs = require('fs');
  
  try {
    const itaContent = fs.readFileSync(path.join(repoPath, 'Elenco Link ITA.txt'), 'utf-8');
    const engContent = fs.readFileSync(path.join(repoPath, 'Elenco Link ENG.txt'), 'utf-8');
    
    const itaMap = parseLinks(itaContent);
    const engMap = parseLinks(engContent);
    
    const insertStmt = db.prepare('INSERT INTO marchi (nome, link_ita, link_eng) VALUES (?, ?, ?)');
    
    itaMap.forEach((linkIta, nome) => {
      const linkEng = engMap.get(nome) || '';
      insertStmt.run(nome, linkIta, linkEng);
    });
    
    log.info('Imported ' + itaMap.size + ' marchi');
  } catch (err) {
    log.warn('Could not import initial data:', err);
  }
}

function reimportEngLinks() {
  const repoPath = path.join(__dirname, '..', 'repository');
  const fs = require('fs');
  
  try {
    const engContent = fs.readFileSync(path.join(repoPath, 'Elenco Link ENG.txt'), 'utf-8');
    const engMap = parseLinks(engContent);
    
    const updateStmt = db.prepare('UPDATE marchi SET link_eng = ? WHERE nome = ?');
    
    engMap.forEach((linkEng, nome) => {
      updateStmt.run(linkEng, nome);
    });
    
    log.info('Updated ' + engMap.size + ' English links');
  } catch (err) {
    log.warn('Could not reimport English links:', err);
  }
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb };