import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    return res.status(400).json({ error: { message } });
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Malformed JSON body' } });
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'Request body too large' } });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }

  // Unknown error: log full detail server-side, never leak stack traces to clients.
  console.error('[error]', req.method, req.originalUrl, err);
  return res.status(500).json({
    error: { message: 'Internal server error', ...(env.isProd ? {} : { debug: err?.message }) },
  });
}
