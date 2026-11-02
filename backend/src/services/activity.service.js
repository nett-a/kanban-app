import { activitiesRepo, usersRepo } from '../repositories/index.js';
import { newId } from '../utils/id.js';
import { toPublicUser } from './user.service.js';

const MAX_ACTIVITIES_PER_BOARD = 500;

export function logActivity({ boardId, cardId = null, userId, message }) {
  activitiesRepo.insert({ id: newId(), boardId, cardId, userId, message, createdAt: new Date().toISOString() });

  // Keep the JSON file from growing forever: drop the oldest entries per board.
  const boardActivities = activitiesRepo.find((a) => a.boardId === boardId);
  if (boardActivities.length > MAX_ACTIVITIES_PER_BOARD) {
    const excess = new Set(boardActivities.slice(0, boardActivities.length - MAX_ACTIVITIES_PER_BOARD).map((a) => a.id));
    activitiesRepo.removeWhere((a) => excess.has(a.id));
  }
}

export function listActivities(predicate, limit = 50) {
  return activitiesRepo
    .find(predicate)
    .slice(-limit)
    .reverse()
    .map((a) => ({ ...a, user: toPublicUser(usersRepo.findById(a.userId)) }));
}
