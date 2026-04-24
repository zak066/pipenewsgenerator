class AppError extends Error {
  constructor(message, code, status = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      status: this.status
    };
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.details = details;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      status: this.status,
      details: this.details
    };
  }
}

class NotFoundError extends AppError {
  constructor(entity = 'Resource') {
    super(`${entity} non trovato`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      status: this.status
    };
  }
}

class ExternalApiError extends AppError {
  constructor(service, message, status = 500) {
    super(message, `${service.toUpperCase()}_ERROR`, status);
    this.name = 'ExternalApiError';
    this.service = service;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      status: this.status,
      service: this.service
    };
  }
}

function isAppError(err) {
  return err instanceof AppError;
}

function wrapError(err, defaultMessage = 'Si è verificato un errore') {
  if (isAppError(err)) return err;
  if (err instanceof Error) {
    return new AppError(defaultMessage, 'INTERNAL_ERROR', 500);
  }
  return new AppError(defaultMessage, 'UNKNOWN_ERROR', 500);
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ExternalApiError,
  isAppError,
  wrapError
};