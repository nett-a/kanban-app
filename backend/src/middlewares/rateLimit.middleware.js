import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const json = (message) => ({ error: { message } });

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: json('Too many requests, please try again later'),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.loginRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: json('Too many login attempts, please try again in 15 minutes'),
});
