import { http } from './client.js';

export const authApi = {
  login: (username, password) => http.post('/auth/login', { username, password }),
  logout: () => http.post('/auth/logout'),
  me: () => http.get('/auth/me'),
};

export const userApi = {
  list: (q = '') => http.get(`/users?q=${encodeURIComponent(q)}`),
  search: (q, signal) => http.get(`/search?q=${encodeURIComponent(q)}`, { signal }),
};

export const workspaceApi = {
  list: () => http.get('/workspaces'),
  create: (name) => http.post('/workspaces', { name }),
};

export const boardApi = {
  list: () => http.get('/boards'),
  create: (data) => http.post('/boards', data),
  get: (boardId) => http.get(`/boards/${boardId}`),
  update: (boardId, data) => http.patch(`/boards/${boardId}`, data),
  remove: (boardId) => http.delete(`/boards/${boardId}`),
  toggleStar: (boardId) => http.post(`/boards/${boardId}/star`),
  archived: (boardId) => http.get(`/boards/${boardId}/archived`),
  activities: (boardId) => http.get(`/boards/${boardId}/activities`),
  addMember: (boardId, userId) => http.post(`/boards/${boardId}/members`, { userId }),
  removeMember: (boardId, userId) => http.delete(`/boards/${boardId}/members/${userId}`),
  createLabel: (boardId, data) => http.post(`/boards/${boardId}/labels`, data),
  updateLabel: (boardId, labelId, data) => http.patch(`/boards/${boardId}/labels/${labelId}`, data),
  deleteLabel: (boardId, labelId) => http.delete(`/boards/${boardId}/labels/${labelId}`),
};

export const listApi = {
  create: (boardId, title) => http.post(`/boards/${boardId}/lists`, { title }),
  update: (listId, data) => http.patch(`/lists/${listId}`, data),
  move: (listId, index) => http.patch(`/lists/${listId}/move`, { index }),
  remove: (listId) => http.delete(`/lists/${listId}`),
};

export const cardApi = {
  create: (listId, title) => http.post(`/lists/${listId}/cards`, { title }),
  get: (cardId) => http.get(`/cards/${cardId}`),
  update: (cardId, data) => http.patch(`/cards/${cardId}`, data),
  move: (cardId, listId, index) => http.patch(`/cards/${cardId}/move`, { listId, index }),
  remove: (cardId) => http.delete(`/cards/${cardId}`),

  addChecklist: (cardId, title) => http.post(`/cards/${cardId}/checklists`, { title }),
  updateChecklist: (cardId, checklistId, title) => http.patch(`/cards/${cardId}/checklists/${checklistId}`, { title }),
  deleteChecklist: (cardId, checklistId) => http.delete(`/cards/${cardId}/checklists/${checklistId}`),
  addItem: (cardId, checklistId, text) => http.post(`/cards/${cardId}/checklists/${checklistId}/items`, { text }),
  updateItem: (cardId, checklistId, itemId, data) =>
    http.patch(`/cards/${cardId}/checklists/${checklistId}/items/${itemId}`, data),
  deleteItem: (cardId, checklistId, itemId) => http.delete(`/cards/${cardId}/checklists/${checklistId}/items/${itemId}`),

  addComment: (cardId, text) => http.post(`/cards/${cardId}/comments`, { text }),
  updateComment: (commentId, text) => http.patch(`/comments/${commentId}`, { text }),
  deleteComment: (commentId) => http.delete(`/comments/${commentId}`),

  uploadAttachment: (cardId, file) => {
    const form = new FormData();
    form.append('file', file);
    return http.upload(`/cards/${cardId}/attachments`, form);
  },
  deleteAttachment: (cardId, attachmentId) => http.delete(`/cards/${cardId}/attachments/${attachmentId}`),
  attachmentUrl: (cardId, attachmentId, inline = false) =>
    `/api/cards/${cardId}/attachments/${attachmentId}${inline ? '?inline=1' : ''}`,
};
