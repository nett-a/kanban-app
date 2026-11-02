import { dueStatus } from './date.js';

export const EMPTY_FILTERS = { keyword: '', labelIds: [], memberIds: [], due: null };

export const countActiveFilters = (f) =>
  (f.keyword.trim() ? 1 : 0) + f.labelIds.length + f.memberIds.length + (f.due ? 1 : 0);

export function matchesFilters(card, f) {
  const keyword = f.keyword.trim().toLowerCase();
  if (keyword && !card.title.toLowerCase().includes(keyword) && !card.description.toLowerCase().includes(keyword)) {
    return false;
  }
  if (f.labelIds.length && !f.labelIds.some((id) => card.labelIds.includes(id))) return false;
  if (f.memberIds.length && !f.memberIds.some((id) => card.memberIds.includes(id))) return false;
  if (f.due) {
    const status = dueStatus(card.dueDate, card.dueComplete);
    if (f.due === 'none' && status !== null) return false;
    if (f.due !== 'none' && status !== f.due) return false;
  }
  return true;
}
