// localStorage can throw (private mode, blocked storage) — never let it break the UI.

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

const MAX_RECENT = 6;

export function pushRecentBoard(userId, boardId) {
  const key = `flowboard:recent:${userId}`;
  const ids = readJSON(key, []).filter((id) => id !== boardId);
  writeJSON(key, [boardId, ...ids].slice(0, MAX_RECENT));
}

export const getRecentBoardIds = (userId) => readJSON(`flowboard:recent:${userId}`, []);
