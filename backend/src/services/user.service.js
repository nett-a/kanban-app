import { usersRepo } from '../repositories/index.js';

/** Strips secrets — the only shape of a user that ever leaves the API. */
export function toPublicUser(user) {
  if (!user) return null;
  const { id, username, name, email, initials, avatarColor } = user;
  return { id, username, name, email, initials, avatarColor };
}

export function getPublicUsersByIds(ids) {
  return ids.map((id) => toPublicUser(usersRepo.findById(id))).filter(Boolean);
}

export function searchUsers(query) {
  const q = query?.toLowerCase();
  return usersRepo
    .find((u) => !q || u.name.toLowerCase().includes(q) || u.username.includes(q) || u.email.toLowerCase().includes(q))
    .map(toPublicUser);
}
