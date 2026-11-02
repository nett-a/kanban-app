import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { usersRepo } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';
import { toPublicUser } from './user.service.js';

// Compared against when the username doesn't exist, so response time doesn't reveal valid usernames.
const DUMMY_HASH = bcrypt.hashSync('timing-attack-mitigation', 10);

export async function login(username, password) {
  const user = usersRepo.findOne((u) => u.username === username);
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw AppError.unauthorized('Invalid username or password');

  const token = jwt.sign({ sub: user.id }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });
  return { token, user: toPublicUser(user) };
}
