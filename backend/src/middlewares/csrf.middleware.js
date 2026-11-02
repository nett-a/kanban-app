import { AppError } from '../utils/AppError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence-in-depth on top of the SameSite=Strict cookie: state-changing
 * requests must carry a custom header. Browsers cannot add custom headers to
 * cross-site form posts, and cross-origin fetches with one trigger a CORS
 * preflight that our CORS policy rejects.
 */
export function csrfGuard(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
    return next(AppError.forbidden('Missing anti-CSRF header'));
  }
  return next();
}
