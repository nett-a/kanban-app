import { cardsRepo, commentsRepo, listsRepo, persist } from '../repositories/index.js';
import { newId } from '../utils/id.js';
import { byPosition, insertAt, reindex } from '../utils/position.js';
import { assertBoardOwner, getBoardForMember, getListForMember } from './access.service.js';
import { logActivity } from './activity.service.js';
import { removeAttachmentFiles } from './attachment.service.js';

const activeLists = (boardId, excludeId) =>
  listsRepo.find((l) => l.boardId === boardId && !l.archived && l.id !== excludeId).sort(byPosition);

export function createList(boardId, userId, { title }) {
  const board = getBoardForMember(boardId, userId);
  const now = new Date().toISOString();
  const list = listsRepo.insert({
    id: newId(),
    boardId: board.id,
    title,
    position: activeLists(board.id).length,
    archived: false,
    createdAt: now,
    updatedAt: now,
  });
  logActivity({ boardId: board.id, userId, message: `added list "${title}" to this board` });
  persist();
  return list;
}

export function updateList(listId, userId, patch) {
  const { list, board } = getListForMember(listId, userId);

  if (patch.archived !== undefined && patch.archived !== list.archived) {
    // Archived lists leave the ordering; restored lists go to the end.
    const siblings = activeLists(board.id, list.id);
    if (!patch.archived) list.position = siblings.length;
    reindex(siblings);
    logActivity({
      boardId: board.id,
      userId,
      message: `${patch.archived ? 'archived' : 'restored'} list "${list.title}"`,
    });
  }
  listsRepo.update(list.id, patch);
  persist();
  return list;
}

export function moveList(listId, userId, { index }) {
  const { list, board } = getListForMember(listId, userId);
  insertAt(activeLists(board.id, list.id), list, index);
  persist();
  return activeLists(board.id);
}

export async function deleteList(listId, userId) {
  const { list, board } = getListForMember(listId, userId);
  assertBoardOwner(board, userId);

  const cards = cardsRepo.find((c) => c.listId === list.id);
  const cardIds = new Set(cards.map((c) => c.id));
  commentsRepo.removeWhere((c) => cardIds.has(c.cardId));
  cardsRepo.removeWhere((c) => cardIds.has(c.id));
  listsRepo.remove(list.id);
  reindex(activeLists(board.id));
  logActivity({ boardId: board.id, userId, message: `deleted list "${list.title}"` });
  await persist();
  await removeAttachmentFiles(cards.flatMap((c) => c.attachments));
}
