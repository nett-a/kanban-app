import { AppError } from '../utils/AppError.js';

/**
 * Validates req.params / req.query / req.body against zod schemas.
 * Parsed (trimmed, coerced, stripped) values are exposed on `req.valid`,
 * and `req.body` is replaced so unknown fields never reach services.
 */
export const validate = (schemas) => (req, _res, next) => {
  req.valid ??= {};
  for (const key of ['params', 'query', 'body']) {
    const schema = schemas[key];
    if (!schema) continue;

    const result = schema.safeParse(req[key] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || key,
        message: issue.message,
      }));
      return next(AppError.badRequest('Validation failed', details));
    }
    req.valid[key] = result.data;
    if (key === 'body') req.body = result.data;
  }
  return next();
};
