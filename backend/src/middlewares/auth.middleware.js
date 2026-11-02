import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { usersRepo } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';

/** Verifies the JWT from the httpOnly cookie and attaches `req.user`. */
export function requireAuth(req, _res, next) {
  const token = req.cookies?.[env.cookieName];
  if (!token) return next(AppError.unauthorized());

  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    const user = usersRepo.findById(payload.sub);
    if (!user) return next(AppError.unauthorized('Session is no longer valid'));
    req.user = user;
    return next();
  } catch {
    return next(AppError.unauthorized('Session expired or invalid'));
  }
}
