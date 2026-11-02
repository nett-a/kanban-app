import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { listApi } from '../../api/index.js';
import { useBoardMutation } from '../../hooks/queries.js';

export function AddList({ boardId }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const create = useBoardMutation(boardId, (t) => listApi.create(boardId, t), { onSuccess: () => setTitle('') });

  const submit = (e) => {
    e.preventDefault();
    const t = title.trim();
    if (t) create.mutate(t);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-72 shrink-0 items-center gap-2 rounded-xl bg-white/25 px-3 py-2.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/35"
      >
        <Plus size={16} /> Add another list
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="w-72 shrink-0 rounded-xl bg-list p-2 shadow-sm">
      <input
        autoFocus
        value={title}
        maxLength={100}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Enter list name…"
        aria-label="List name"
        className="input"
      />
      <div className="mt-2 flex items-center gap-1">
        <button type="submit" className="btn-primary" disabled={!title.trim() || create.isPending}>
          Add list
        </button>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cancel" className="btn-ghost px-2">
          <X size={18} />
        </button>
      </div>
    </form>
  );
}
