const shortFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const longFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const formatShortDate = (iso) => (iso ? shortFmt.format(new Date(iso)) : '');
export const formatDateTime = (iso) => (iso ? longFmt.format(new Date(iso)) : '');

/** 'complete' | 'overdue' | 'soon' | 'upcoming' | null — drives due-date badge colour. */
export function dueStatus(dueDate, dueComplete) {
  if (!dueDate) return null;
  if (dueComplete) return 'complete';
  const diff = new Date(dueDate).getTime() - Date.now();
  if (diff < 0) return 'overdue';
  if (diff < 24 * 60 * 60 * 1000) return 'soon';
  return 'upcoming';
}

export const DUE_STATUS_CLASS = {
  complete: 'bg-emerald-500 text-white',
  overdue: 'bg-red-500 text-white',
  soon: 'bg-amber-400 text-amber-950',
  upcoming: 'text-slate-600',
};

/** ISO string -> value for <input type="datetime-local"> in local time. */
export function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function timeAgo(iso) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return formatShortDate(iso);
}

export const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
