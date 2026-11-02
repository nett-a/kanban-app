import { cardsRepo, commentsRepo, listsRepo, persist } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';
import { newId } from '../utils/id.js';
import { byPosition, insertAt, reindex } from '../utils/position.js';
import { getCardForMember, getListForMember } from './access.service.js';
import { listActivities, logActivity } from './activity.service.js';
import { removeAttachmentFiles } from './attachment.service.js';
import { toCardSummary } from './board.service.js';
import { getPublicUsersByIds } from './user.service.js';
import { listComments } from './comment.service.js';

const activeCards = (listId, excludeId) =>
  cardsRepo.find((c) => c.listId === listId && !c.archived && c.id !== excludeId).sort(byPosition);

function toCardDetail(card, board) {
  const list = listsRepo.findById(card.listId);
  return {
    ...toCardSummary(card),
    listTitle: list?.title ?? null,
    members: getPublicUsersByIds(card.memberIds),
    comments: listComments(card.id),
    activities: listActivities((a) => a.cardId === card.id, 50),
    boardTitle: board.title,
  };
}

export function createCard(listId, userId, { title }) {
  const { list, board } = getListForMember(listId, userId);
  const now = new Date().toISOString();
  const card = cardsRepo.insert({
    id: newId(),
    boardId: board.id,
    listId: list.id,
    title,
    description: '',
    position: activeCards(list.id).length,
    labelIds: [],
    memberIds: [],
    startDate: null,
    dueDate: null,
    dueComplete: false,
    cover: null,
    checklists: [],
    attachments: [],
    archived: false,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  });
  logActivity({ boardId: board.id, cardId: card.id, userId, message: `added this card to ${list.title}` });
  persist();
  return toCardSummary(card);
}

export function getCardDetail(cardId, userId) {
  const { card, board } = getCardForMember(cardId, userId);
  return toCardDetail(card, board);
}

export function updateCard(cardId, userId, patch) {
  const { card, board } = getCardForMember(cardId, userId);

  if (patch.labelIds) {
    const valid = new Set(board.labels.map((l) => l.id));
    if (patch.labelIds.some((id) => !valid.has(id))) throw AppError.badRequest('Unknown label for this board');
    patch.labelIds = [...new Set(patch.labelIds)];
  }
  if (patch.memberIds) {
    if (patch.memberIds.some((id) => !board.memberIds.includes(id))) {
      throw AppError.badRequest('Card members must be members of the board');
    }
    patch.memberIds = [...new Set(patch.memberIds)];
    for (const id of patch.memberIds.filter((m) => !card.memberIds.includes(m))) {
      const [user] = getPublicUsersByIds([id]);
      logActivity({
        boardId: board.id,
        cardId,
        userId,
        message: id === userId ? 'joined this card' : `added ${user?.name} to this card`,
      });
    }
  }
  if (patch.dueComplete !== undefined && patch.dueComplete !== card.dueComplete) {
    logActivity({
      boardId: board.id,
      cardId,
      userId,
      message: patch.dueComplete ? 'marked the due date complete' : 'marked the due date incomplete',
    });
  }
  if (patch.archived !== undefined && patch.archived !== card.archived) {
    const siblings = activeCards(card.listId, card.id);
    if (!patch.archived) card.position = siblings.length;
    reindex(siblings);
    logActivity({ boardId: board.id, cardId, userId, message: patch.archived ? 'archived this card' : 'sent this card to the board' });
  }

  cardsRepo.update(card.id, patch);
  persist();
  return toCardDetail(card, board);
}

export function moveCard(cardId, userId, { listId, index }) {
  const { card, board } = getCardForMember(cardId, userId);
  const { list: target, board: targetBoard } = getListForMember(listId, userId);
  if (target.archived) throw AppError.badRequest('Cannot move a card into an archived list');

  const sourceListId = card.listId;
  if (sourceListId !== target.id) reindex(activeCards(sourceListId, card.id));

  if (targetBoard.id !== board.id) {
    // Labels are per board and members must belong to the destination board.
    card.boardId = targetBoard.id;
    card.labelIds = [];
    card.memberIds = card.memberIds.filter((id) => targetBoard.memberIds.includes(id));
  }
  card.listId = target.id;
  card.archived = false;
  card.updatedAt = new Date().toISOString();
  insertAt(activeCards(target.id, card.id), card, index);

  if (sourceListId !== target.id) {
    const source = listsRepo.findById(sourceListId);
    logActivity({
      boardId: targetBoard.id,
      cardId,
      userId,
      message: `moved this card from ${source?.title ?? 'a list'} to ${target.title}`,
    });
  }
  persist();
  return toCardSummary(card);
}

export async function deleteCard(cardId, userId) {
  const { card } = getCardForMember(cardId, userId);
  commentsRepo.removeWhere((c) => c.cardId === card.id);
  cardsRepo.remove(card.id);
  reindex(activeCards(card.listId));
  logActivity({ boardId: card.boardId, userId, message: `deleted card "${card.title}"` });
  await persist();
  await removeAttachmentFiles(card.attachments);
}

/* ----------------------------- Checklists ----------------------------- */

function findChecklist(card, checklistId) {
  const checklist = card.checklists.find((cl) => cl.id === checklistId);
  if (!checklist) throw AppError.notFound('Checklist not found');
  return checklist;
}

function findItem(checklist, itemId) {
  const item = checklist.items.find((i) => i.id === itemId);
  if (!item) throw AppError.notFound('Checklist item not found');
  return item;
}

const touch = (card) => {
  card.updatedAt = new Date().toISOString();
};

export function addChecklist(cardId, userId, { title }) {
  const { card } = getCardForMember(cardId, userId);
  const checklist = { id: newId(), title, items: [] };
  card.checklists.push(checklist);
  touch(card);
  logActivity({ boardId: card.boardId, cardId, userId, message: `added checklist "${title}"` });
  persist();
  return checklist;
}

export function updateChecklist(cardId, checklistId, userId, { title }) {
  const { card } = getCardForMember(cardId, userId);
  const checklist = findChecklist(card, checklistId);
  checklist.title = title;
  touch(card);
  persist();
  return checklist;
}

export function deleteChecklist(cardId, checklistId, userId) {
  const { card } = getCardForMember(cardId, userId);
  const checklist = findChecklist(card, checklistId);
  card.checklists = card.checklists.filter((cl) => cl.id !== checklistId);
  touch(card);
  logActivity({ boardId: card.boardId, cardId, userId, message: `removed checklist "${checklist.title}"` });
  persist();
}

export function addChecklistItem(cardId, checklistId, userId, { text }) {
  const { card } = getCardForMember(cardId, userId);
  const checklist = findChecklist(card, checklistId);
  const item = { id: newId(), text, done: false };
  checklist.items.push(item);
  touch(card);
  persist();
  return item;
}

export function updateChecklistItem(cardId, checklistId, itemId, userId, patch) {
  const { card } = getCardForMember(cardId, userId);
  const item = findItem(findChecklist(card, checklistId), itemId);
  if (patch.done === true && !item.done) {
    logActivity({ boardId: card.boardId, cardId, userId, message: `completed "${item.text}"` });
  }
  Object.assign(item, patch);
  touch(card);
  persist();
  return item;
}

export function deleteChecklistItem(cardId, checklistId, itemId, userId) {
  const { card } = getCardForMember(cardId, userId);
  const checklist = findChecklist(card, checklistId);
  findItem(checklist, itemId);
  checklist.items = checklist.items.filter((i) => i.id !== itemId);
  touch(card);
  persist();
}
