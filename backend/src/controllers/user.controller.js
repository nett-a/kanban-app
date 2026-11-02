import * as userService from '../services/user.service.js';
import * as workspaceService from '../services/workspace.service.js';
import * as searchService from '../services/search.service.js';

export function listUsers(req, res) {
  res.json({ users: userService.searchUsers(req.valid.query.q) });
}

export function listWorkspaces(req, res) {
  res.json({ workspaces: workspaceService.listWorkspaces(req.user.id) });
}

export function createWorkspace(req, res) {
  res.status(201).json({ workspace: workspaceService.createWorkspace(req.user.id, req.body) });
}

export function search(req, res) {
  res.json(searchService.search(req.user.id, req.valid.query.q));
}
