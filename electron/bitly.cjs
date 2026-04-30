const { getDb } = require('./database.cjs');
const log = require('electron-log');
const config = require('./config.cjs');
const { ExternalApiError, wrapError } = require('./errors.cjs');

let cachedTokens = {
  bitly: null,
  tinyurl: null
};

let tokenCacheTime = 0;
const TOKEN_CACHE_TTL = 60000;

function getCachedToken(key) {
  const now = Date.now();
  if (now - tokenCacheTime > TOKEN_CACHE_TTL || cachedTokens[key] === null) {
    cachedTokens[key] = null;
    tokenCacheTime = now;
  }
  return cachedTokens[key];
}

function setCachedToken(key, value) {
  cachedTokens[key] = value;
  tokenCacheTime = Date.now();
}

function clearTokenCache() {
  cachedTokens = { bitly: null, tinyurl: null };
  tokenCacheTime = 0;
}

async function generateBitlyLink(longUrl) {
  try {
    let token = getCachedToken('bitly');
    if (!token) {
      const db = getDb();
      if (!db) throw new ExternalApiError('bitly', 'Database non inizializzato');
      const settings = db.prepare('SELECT value FROM settings WHERE key = ?').get('bitly_token');
      token = settings?.value || null;
      setCachedToken('bitly', token);
    }
    
    if (!token) {
      return { shortLink: '', error: 'API token bit.ly non configurato. Vai nelle impostazioni.' };
    }
    
    const response = await fetch(config.api.bitly.baseUrl + config.api.bitly.endpoints.shorten, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        long_url: longUrl,
        domain: 'bit.ly',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      log.error('Bit.ly API error:', errorData);
      return { shortLink: '', error: 'Errore API: ' + (errorData.description || response.statusText) };
    }
    
    const data = await response.json();
    return { shortLink: data.link };
  } catch (err) {
    log.error('Bit.ly request failed:', err);
    const appError = wrapError(err, 'Richiesta bit.ly fallita');
    return { shortLink: '', error: appError.message };
  }
}

async function convertToTinyUrl(url) {
  try {
    if (!url || url.trim() === '') {
      return { shortLink: '', error: 'Nessun URL da convertire' };
    }
    
    log.info('TinyURL: converting URL:', url);
    
    let token = getCachedToken('tinyurl');
    if (!token) {
      const db = getDb();
      if (!db) throw new ExternalApiError('tinyurl', 'Database non inizializzato');
      const settings = db.prepare('SELECT value FROM settings WHERE key = ?').get('tinyurl_token');
      token = settings?.value || null;
      setCachedToken('tinyurl', token);
    }
    
    if (!token) {
      log.warn('TinyURL: no token configured');
      return { shortLink: '', error: 'Token TinyURL non configurato. Vai nelle Impostazioni.' };
    }
    
    let urlToConvert = url;
    
    if (url.includes('bit.ly')) {
      log.info('TinyURL: resolving bit.ly URL:', url);
      const resolved = await resolveBitlyUrl(url);
      if (!resolved) {
        log.warn('TinyURL: failed to resolve bit.ly URL');
        return { shortLink: '', error: 'Impossibile risolvere l\'URL bit.ly' };
      }
      urlToConvert = resolved;
      log.info('TinyURL: resolved to:', urlToConvert);
    }
    
    log.info('TinyURL: calling API with URL:', urlToConvert);
    const response = await fetch(config.api.tinyurl.baseUrl + config.api.tinyurl.endpoints.create, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlToConvert,
      }),
    });
    
    log.info('TinyURL: API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      log.error('TinyURL API error:', errorData);
      return { shortLink: '', error: 'Errore API TinyURL: ' + (errorData.errors?.[0]?.message || response.statusText) };
    }
    
    const data = await response.json();
    log.info('TinyURL: response data:', data);
    const shortLink = data.data?.tiny_url || data.tiny_url || data.url || data.short_url || '';
    if (!shortLink) {
      log.error('TinyURL: no short link in response', data);
      return { shortLink: '', error: 'Errore: impossibile ottenere il link corto' };
    }
    return { shortLink };
  } catch (err) {
    log.error('TinyURL conversion failed:', err);
    const appError = wrapError(err, 'Conversione TinyURL fallita');
    return { shortLink: '', error: appError.message };
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

async function resolveShortUrl(shortUrl) {
  try {
    log.info('Resolving short URL:', shortUrl);
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow'
    });
    
    const finalUrl = response.url;
    log.info('Resolved to:', finalUrl);
    return finalUrl || shortUrl;
  } catch (err) {
    log.error('Failed to resolve short URL:', err);
    return shortUrl;
  }
}

module.exports = {
  generateBitlyLink,
  convertToTinyUrl,
  testLink,
  resolveBitlyUrl,
  resolveShortUrl,
  clearTokenCache
};
