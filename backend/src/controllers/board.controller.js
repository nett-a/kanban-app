import * as boardService from '../services/board.service.js';

export function listBoards(req, res) {
  res.json({ boards: boardService.listBoards(req.user.id) });
}

export function createBoard(req, res) {
  res.status(201).json({ board: boardService.createBoard(req.user.id, req.body) });
}

export function getBoard(req, res) {
  res.json(boardService.getBoardDetail(req.params.boardId, req.user.id));
}

export function updateBoard(req, res) {
  res.json({ board: boardService.updateBoard(req.params.boardId, req.user.id, req.body) });
}

export async function deleteBoard(req, res) {
  await boardService.deleteBoard(req.params.boardId, req.user.id);
  res.status(204).end();
}

export function toggleStar(req, res) {
  res.json(boardService.toggleStar(req.params.boardId, req.user.id));
}

export function addMember(req, res) {
  res.status(201).json({ members: boardService.addMember(req.params.boardId, req.user.id, req.body.userId) });
}

export function removeMember(req, res) {
  res.json({ members: boardService.removeMember(req.params.boardId, req.user.id, req.params.userId) });
}

export function createLabel(req, res) {
  res.status(201).json({ label: boardService.createLabel(req.params.boardId, req.user.id, req.body) });
}

export function updateLabel(req, res) {
  const { boardId, labelId } = req.params;
  res.json({ label: boardService.updateLabel(boardId, labelId, req.user.id, req.body) });
}

export function deleteLabel(req, res) {
  boardService.deleteLabel(req.params.boardId, req.params.labelId, req.user.id);
  res.status(204).end();
}

export function getArchived(req, res) {
  res.json(boardService.getArchivedItems(req.params.boardId, req.user.id));
}

export function getActivities(req, res) {
  res.json({ activities: boardService.getBoardActivities(req.params.boardId, req.user.id) });
}
