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

async function convertToTinyUrl(url) {
  if (!url || url.trim() === '') {
    return { shortLink: '', error: 'Nessun URL da convertire' };
  }
  
  const db = getDb();
  const settings = db.prepare('SELECT value FROM settings WHERE key = ?').get('tinyurl_token');
  
  if (!settings || !settings.value) {
    return { shortLink: '', error: 'Token TinyURL non configurato. Vai nelle Impostazioni.' };
  }
  
  try {
    let urlToConvert = url;
    
    if (url.includes('bit.ly')) {
      const resolved = await resolveBitlyUrl(url);
      if (!resolved) {
        return { shortLink: '', error: 'Impossibile risolvere l\'URL bit.ly' };
      }
      urlToConvert = resolved;
    }
    
    const response = await fetch('https://api.tinyurl.com/create', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + settings.value,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlToConvert,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      log.error('TinyURL API error:', errorData);
      return { shortLink: '', error: 'Errore API TinyURL: ' + (errorData.errors?.[0]?.message || response.statusText) };
    }
    
    const data = await response.json();
    return { shortLink: data.data?.tiny_url || data.tiny_url || '' };
  } catch (err) {
    log.error('TinyURL conversion failed:', err);
    return { shortLink: '', error: 'Richiesta fallita. Controlla la connessione.' };
  }
}

async function resolveBitlyUrl(bitlyUrl) {
  try {
    const response = await fetch(bitlyUrl, {
      method: 'GET',
      redirect: 'manual'
    });
    
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('location');
      return location || null;
    }
    
    return null;
  } catch (err) {
    log.error('Failed to resolve bit.ly URL:', err);
    return null;
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

module.exports = { generateBitlyLink, convertToTinyUrl, testLink, resolveBitlyUrl };