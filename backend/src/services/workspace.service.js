import { persist, workspacesRepo } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';
import { newId } from '../utils/id.js';

export function listWorkspaces(userId) {
  return workspacesRepo.find((w) => w.memberIds.includes(userId));
}

export function getWorkspaceForMember(workspaceId, userId) {
  const workspace = workspacesRepo.findById(workspaceId);
  if (!workspace || !workspace.memberIds.includes(userId)) throw AppError.notFound('Workspace not found');
  return workspace;
}

export function createWorkspace(userId, { name }) {
  const workspace = workspacesRepo.insert({
    id: newId(),
    name,
    ownerId: userId,
    memberIds: [userId],
    createdAt: new Date().toISOString(),
  });
  persist();
  return workspace;
}
