const { getDb } = require('./database.cjs');
const log = require('electron-log');

async function generateBitlyLink(longUrl) {
  const db = getDb();
  const settings = db.prepare('SELECT value FROM settings WHERE key = ?').get('bitly_token');
  
  if (!settings || !settings.value) {
    return { shortLink: '', error: 'API token bit.ly non configurato. Vai nelle impostazioni.' };
  }
  
  try {
    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + settings.value,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        long_url: longUrl,
        domain: 'bit.ly',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      log.error('Bit.ly API error:', errorData);
      return { shortLink: '', error: 'Errore API: ' + (errorData.description || response.statusText) };
    }
    
    const data = await response.json();
    return { shortLink: data.link };
  } catch (err) {
    log.error('Bit.ly request failed:', err);
    return { shortLink: '', error: 'Richiesta fallita. Controlla la connessione.' };
  }
}

async function testLink(url) {
  if (!url || url.trim() === '') {
    return { status: 'invalid', message: 'Link non presente' };
  }
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow'
    });
    
    if (response.ok || response.status === 301 || response.status === 302) {
      return { status: 'ok', statusCode: response.status, message: 'Link funzionante' };
    } else {
      return { status: 'error', statusCode: response.status, message: 'Errore HTTP: ' + response.status };
    }
  } catch (err) {
    return { status: 'error', message: 'Errore: ' + err.message };
  }
}

module.exports = { generateBitlyLink, testLink };