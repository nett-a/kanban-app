import {
  activitiesRepo,
  boardsRepo,
  cardsRepo,
  commentsRepo,
  listsRepo,
  persist,
  usersRepo,
  workspacesRepo,
} from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';
import { newId } from '../utils/id.js';
import { byPosition } from '../utils/position.js';
import { assertBoardOwner, getBoardForMember } from './access.service.js';
import { listActivities, logActivity } from './activity.service.js';
import { removeAttachmentFiles } from './attachment.service.js';
import { getPublicUsersByIds, toPublicUser } from './user.service.js';
import { getWorkspaceForMember } from './workspace.service.js';

const DEFAULT_LABELS = [
  { name: '', color: 'green' },
  { name: '', color: 'yellow' },
  { name: '', color: 'orange' },
  { name: '', color: 'red' },
  { name: '', color: 'purple' },
  { name: '', color: 'blue' },
];

/** Card shape used on the board: full card plus pre-computed badge counts. */
export function toCardSummary(card) {
  const items = card.checklists.flatMap((cl) => cl.items);
  return {
    ...card,
    badges: {
      comments: commentsRepo.find((c) => c.cardId === card.id).length,
      attachments: card.attachments.length,
      checkItems: items.length,
      checkItemsDone: items.filter((i) => i.done).length,
    },
  };
}

function toBoardSummary(board, userId) {
  const workspace = workspacesRepo.findById(board.workspaceId);
  return {
    id: board.id,
    title: board.title,
    background: board.background,
    workspaceId: board.workspaceId,
    workspaceName: workspace?.name ?? null,
    ownerId: board.ownerId,
    starred: board.starredBy.includes(userId),
    memberCount: board.memberIds.length,
    updatedAt: board.updatedAt,
  };
}

function toBoardDetail(board, userId) {
  const { starredBy, ...rest } = board;
  return {
    ...rest,
    workspaceName: workspacesRepo.findById(board.workspaceId)?.name ?? null,
    starred: starredBy.includes(userId),
    members: getPublicUsersByIds(board.memberIds),
  };
}

export function listBoards(userId) {
  return boardsRepo
    .find((b) => b.memberIds.includes(userId))
    .map((b) => toBoardSummary(b, userId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function createBoard(userId, { title, background, workspaceId }) {
  getWorkspaceForMember(workspaceId, userId);
  const now = new Date().toISOString();
  const board = boardsRepo.insert({
    id: newId(),
    title,
    background,
    workspaceId,
    ownerId: userId,
    memberIds: [userId],
    starredBy: [],
    labels: DEFAULT_LABELS.map((l) => ({ id: newId(), ...l })),
    createdAt: now,
    updatedAt: now,
  });
  logActivity({ boardId: board.id, userId, message: 'created this board' });
  persist();
  return toBoardSummary(board, userId);
}

export function getBoardDetail(boardId, userId) {
  const board = getBoardForMember(boardId, userId);
  const lists = listsRepo.find((l) => l.boardId === board.id && !l.archived).sort(byPosition);
  const listIds = new Set(lists.map((l) => l.id));
  const cards = cardsRepo
    .find((c) => c.boardId === board.id && !c.archived && listIds.has(c.listId))
    .sort(byPosition)
    .map(toCardSummary);
  return { board: toBoardDetail(board, userId), lists, cards };
}

export function updateBoard(boardId, userId, patch) {
  const board = getBoardForMember(boardId, userId);
  boardsRepo.update(board.id, patch);
  if (patch.title) logActivity({ boardId, userId, message: `renamed this board to "${patch.title}"` });
  persist();
  return toBoardDetail(board, userId);
}

export async function deleteBoard(boardId, userId) {
  const board = getBoardForMember(boardId, userId);
  assertBoardOwner(board, userId);

  const cards = cardsRepo.find((c) => c.boardId === board.id);
  const cardIds = new Set(cards.map((c) => c.id));

  commentsRepo.removeWhere((c) => cardIds.has(c.cardId));
  cardsRepo.removeWhere((c) => c.boardId === board.id);
  listsRepo.removeWhere((l) => l.boardId === board.id);
  activitiesRepo.removeWhere((a) => a.boardId === board.id);
  boardsRepo.remove(board.id);
  await persist();
  await removeAttachmentFiles(cards.flatMap((c) => c.attachments));
}

export function toggleStar(boardId, userId) {
  const board = getBoardForMember(boardId, userId);
  const starred = board.starredBy.includes(userId);
  board.starredBy = starred ? board.starredBy.filter((id) => id !== userId) : [...board.starredBy, userId];
  persist();
  return { starred: !starred };
}

export function addMember(boardId, userId, newMemberId) {
  const board = getBoardForMember(boardId, userId);
  const newMember = usersRepo.findById(newMemberId);
  if (!newMember) throw AppError.notFound('User not found');
  if (board.memberIds.includes(newMemberId)) throw AppError.conflict('User is already a member of this board');

  board.memberIds.push(newMemberId);
  logActivity({ boardId, userId, message: `added ${newMember.name} to this board` });
  persist();
  return getPublicUsersByIds(board.memberIds);
}

export function removeMember(boardId, userId, memberId) {
  const board = getBoardForMember(boardId, userId);
  if (memberId === board.ownerId) throw AppError.badRequest('The board owner cannot be removed');
  // Anyone can leave; only the owner can remove other people.
  if (memberId !== userId) assertBoardOwner(board, userId);
  if (!board.memberIds.includes(memberId)) throw AppError.notFound('User is not a member of this board');

  board.memberIds = board.memberIds.filter((id) => id !== memberId);
  board.starredBy = board.starredBy.filter((id) => id !== memberId);
  for (const card of cardsRepo.find((c) => c.boardId === board.id)) {
    card.memberIds = card.memberIds.filter((id) => id !== memberId);
  }
  const removed = toPublicUser(usersRepo.findById(memberId));
  logActivity({
    boardId,
    userId,
    message: memberId === userId ? 'left this board' : `removed ${removed?.name ?? 'a member'} from this board`,
  });
  persist();
  return getPublicUsersByIds(board.memberIds);
}

export function createLabel(boardId, userId, { name, color }) {
  const board = getBoardForMember(boardId, userId);
  const label = { id: newId(), name, color };
  board.labels.push(label);
  persist();
  return label;
}

export function updateLabel(boardId, labelId, userId, patch) {
  const board = getBoardForMember(boardId, userId);
  const label = board.labels.find((l) => l.id === labelId);
  if (!label) throw AppError.notFound('Label not found');
  Object.assign(label, patch);
  persist();
  return label;
}

export function deleteLabel(boardId, labelId, userId) {
  const board = getBoardForMember(boardId, userId);
  if (!board.labels.some((l) => l.id === labelId)) throw AppError.notFound('Label not found');
  board.labels = board.labels.filter((l) => l.id !== labelId);
  for (const card of cardsRepo.find((c) => c.boardId === board.id)) {
    card.labelIds = card.labelIds.filter((id) => id !== labelId);
  }
  persist();
}

export function getArchivedItems(boardId, userId) {
  const board = getBoardForMember(boardId, userId);
  const lists = listsRepo.find((l) => l.boardId === board.id);
  const archivedLists = lists.filter((l) => l.archived);
  const listTitles = Object.fromEntries(lists.map((l) => [l.id, l.title]));
  const archivedCards = cardsRepo
    .find((c) => c.boardId === board.id && c.archived)
    .map((c) => ({ ...toCardSummary(c), listTitle: listTitles[c.listId] ?? null }));
  return { lists: archivedLists, cards: archivedCards };
}

export function getBoardActivities(boardId, userId) {
  const board = getBoardForMember(boardId, userId);
  return listActivities((a) => a.boardId === board.id, 100);
}
