import { db } from '../database/jsonDb.js';

/**
 * Thin data-access layer over a JSON collection. Services never touch
 * `db.collection()` directly, so swapping to a real database later only
 * means re-implementing this file.
 */
function createRepository(name) {
  const col = () => db.collection(name);

  return {
    all: () => col(),
    find: (predicate) => col().filter(predicate),
    findOne: (predicate) => col().find(predicate) ?? null,
    findById: (id) => col().find((item) => item.id === id) ?? null,
    insert(entity) {
      col().push(entity);
      return entity;
    },
    update(id, patch) {
      const entity = col().find((item) => item.id === id);
      if (!entity) return null;
      Object.assign(entity, patch, { updatedAt: new Date().toISOString() });
      return entity;
    },
    remove(id) {
      const items = col();
      const index = items.findIndex((item) => item.id === id);
      if (index >= 0) items.splice(index, 1);
    },
    removeWhere(predicate) {
      const items = col();
      for (let i = items.length - 1; i >= 0; i -= 1) {
        if (predicate(items[i])) items.splice(i, 1);
      }
    },
  };
}

export const usersRepo = createRepository('users');
export const workspacesRepo = createRepository('workspaces');
export const boardsRepo = createRepository('boards');
export const listsRepo = createRepository('lists');
export const cardsRepo = createRepository('cards');
export const commentsRepo = createRepository('comments');
export const activitiesRepo = createRepository('activities');

export const persist = () => db.save();
