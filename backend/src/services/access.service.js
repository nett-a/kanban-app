import { boardsRepo, cardsRepo, listsRepo } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';

/*
 * Every board-scoped resource is authorised through the board's member list.
 * Non-members get 404 (not 403) so board/card ids can't be probed.
 */

export function getBoardForMember(boardId, userId) {
  const board = boardsRepo.findById(boardId);
  if (!board || !board.memberIds.includes(userId)) throw AppError.notFound('Board not found');
  return board;
}

export function getListForMember(listId, userId) {
  const list = listsRepo.findById(listId);
  if (!list) throw AppError.notFound('List not found');
  const board = getBoardForMember(list.boardId, userId);
  return { list, board };
}

export function getCardForMember(cardId, userId) {
  const card = cardsRepo.findById(cardId);
  if (!card) throw AppError.notFound('Card not found');
  const board = getBoardForMember(card.boardId, userId);
  return { card, board };
}

export function assertBoardOwner(board, userId) {
  if (board.ownerId !== userId) throw AppError.forbidden('Only the board owner can do this');
}
