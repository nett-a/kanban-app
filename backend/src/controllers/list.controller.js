import * as listService from '../services/list.service.js';

export function createList(req, res) {
  res.status(201).json({ list: listService.createList(req.params.boardId, req.user.id, req.body) });
}

export function updateList(req, res) {
  res.json({ list: listService.updateList(req.params.listId, req.user.id, req.body) });
}

export function moveList(req, res) {
  res.json({ lists: listService.moveList(req.params.listId, req.user.id, req.body) });
}

export async function deleteList(req, res) {
  await listService.deleteList(req.params.listId, req.user.id);
  res.status(204).end();
}
