const { ValidationError } = require('./errors.cjs');
const config = require('./config.cjs');

const schemas = {
  marchio: {
    nome: (value) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new ValidationError('Il nome è obbligatorio');
      }
      if (value.length > config.validation.marchio.nome.maxLength) {
        throw new ValidationError(`Il nome non può superare ${config.validation.marchio.nome.maxLength} caratteri`);
      }
      return value.trim();
    },
    link_ita: (value) => {
      if (!value || value === '') return null;
      if (typeof value !== 'string') return null;
      if (!config.validation.marchio.urlPattern.test(value)) {
        throw new ValidationError('URL ITA non valido');
      }
      return value;
    },
    link_eng: (value) => {
      if (!value || value === '') return null;
      if (typeof value !== 'string') return null;
      if (!config.validation.marchio.urlPattern.test(value)) {
        throw new ValidationError('URL ENG non valido');
      }
      return value;
    }
  },
  templates: {
    validate: (data) => {
      if (!data || typeof data !== 'object') {
        throw new ValidationError('Dati template non validi');
      }
      const required = ['header_ita', 'header_eng', 'footer_ita', 'footer_eng'];
      for (const field of required) {
        if (!(field in data)) {
          throw new ValidationError(`Campo ${field} mancante`);
        }
      }
      return {
        header_ita: String(data.header_ita || ''),
        header_eng: String(data.header_eng || ''),
        footer_ita: String(data.footer_ita || ''),
        footer_eng: String(data.footer_eng || '')
      };
    }
  },
  settings: {
    key: (value) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new ValidationError('La chiave è obbligatoria');
      }
      return value.trim();
    },
    value: (value) => {
      return String(value || '');
    },
    whatsapp_number: (value) => {
      if (!value || value === '') return '';
      if (!config.validation.whatsapp.pattern.test(value)) {
        throw new ValidationError('Numero WhatsApp non valido (es. 393401234567)');
      }
      return value;
    }
  },
  url: {
    validate: (value, fieldName = 'URL') => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new ValidationError(`${fieldName} non può essere vuoto`);
      }
      if (!config.validation.marchio.urlPattern.test(value)) {
        throw new ValidationError(`${fieldName} non valido`);
      }
      return value;
    }
  }
};

function validateId(id, fieldName = 'ID') {
  const num = parseInt(id, 10);
  if (isNaN(num) || num <= 0) {
    throw new ValidationError(`${fieldName} non valido`);
  }
  return num;
}

function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new ValidationError('Nome file non valido');
  }
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new ValidationError('Nome file non valido');
  }
  return filename;
}

function sanitizeString(value, maxLength = 10000) {
  if (!value) return '';
  const str = String(value);
  return str.substring(0, maxLength);
}

module.exports = {
  schemas,
  validateId,
  validateFilename,
  sanitizeString
};