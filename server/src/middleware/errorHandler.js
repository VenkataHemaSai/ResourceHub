import { AppError } from '../utils/errors.js';
import { config } from '../config.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Cannot ${req.method} ${req.path}` } });
}

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { error: { code: err.code, message: err.message } };
    if (err.fields) body.error.fields = err.fields;
    return res.status(err.statusCode).json(body);
  }

  if (config.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    console.error({ message: err.message, stack: err.stack });
  }

  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}
