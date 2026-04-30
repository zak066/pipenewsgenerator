const { z } = require('zod');
const { ValidationError } = require('./errors.cjs');
const config = require('./config.cjs');

// Zod schemas
const MarchioSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio').max(255, 'Massimo 255 caratteri'),
  link_ita: z.string().url('URL ITA non valido').nullable().or(z.literal('')),
  link_eng: z.string().url('URL ENG non valido').nullable().or(z.literal('')),
});

const TemplatesSchema = z.object({
  header_ita: z.string(),
  header_eng: z.string(),
  footer_ita: z.string(),
  footer_eng: z.string(),
});

const SettingsKeySchema = z.string().min(1, 'La chiave è obbligatoria');

const WhatsAppNumberSchema = z.string().regex(/^\+?[0-9]{8,15}$/, 'Numero non valido');

const UrlSchema = z.string().url('URL non valido');

// Validation functions
function validateMarchio(data) {
  try {
    return { success: true, data: MarchioSchema.parse(data) };
  } catch (err) {
    return { success: false, error: err };
  }
}

function validateId(id) {
  const num = parseInt(id, 10);
  if (isNaN(num) || num <= 0) {
    throw new ValidationError('ID non valido');
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
  return String(value).substring(0, maxLength);
}

module.exports = {
  validateMarchio,
  validateId,
  validateFilename,
  sanitizeString,
  schemas: {
    marchio: MarchioSchema,
    templates: TemplatesSchema,
    settings: {
      key: SettingsKeySchema,
      whatsapp_number: WhatsAppNumberSchema,
    },
    url: UrlSchema,
  },
};
