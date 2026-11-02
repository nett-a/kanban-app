import { commentsRepo, persist, usersRepo } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';
import { newId } from '../utils/id.js';
import { getCardForMember } from './access.service.js';
import { logActivity } from './activity.service.js';
import { toPublicUser } from './user.service.js';

const withAuthor = (comment) => ({ ...comment, user: toPublicUser(usersRepo.findById(comment.userId)) });

export function listComments(cardId) {
  return commentsRepo
    .find((c) => c.cardId === cardId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(withAuthor);
}

export function addComment(cardId, userId, { text }) {
  const { card } = getCardForMember(cardId, userId);
  const now = new Date().toISOString();
  const comment = commentsRepo.insert({ id: newId(), cardId: card.id, userId, text, createdAt: now, updatedAt: now });
  logActivity({ boardId: card.boardId, cardId: card.id, userId, message: 'commented on this card' });
  persist();
  return withAuthor(comment);
}

function getOwnComment(commentId, userId) {
  const comment = commentsRepo.findById(commentId);
  if (!comment) throw AppError.notFound('Comment not found');
  getCardForMember(comment.cardId, userId); // must still have access to the board
  if (comment.userId !== userId) throw AppError.forbidden('You can only modify your own comments');
  return comment;
}

export function updateComment(commentId, userId, { text }) {
  const comment = getOwnComment(commentId, userId);
  commentsRepo.update(comment.id, { text, edited: true });
  persist();
  return withAuthor(comment);
}

export function deleteComment(commentId, userId) {
  const comment = getOwnComment(commentId, userId);
  commentsRepo.remove(comment.id);
  persist();
}
