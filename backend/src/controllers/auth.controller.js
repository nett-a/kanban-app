import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import { toPublicUser } from '../services/user.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict',
  path: '/',
};

export async function login(req, res) {
  const { username, password } = req.valid.body;
  const { token, user } = await authService.login(username, password);
  res.cookie(env.cookieName, token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
  res.json({ user });
}

export function logout(_req, res) {
  res.clearCookie(env.cookieName, cookieOptions);
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: toPublicUser(req.user) });
}
