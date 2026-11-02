import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cardApi } from '../../api/index.js';
import { useBoardMutation } from '../../hooks/queries.js';
import { AutoTextarea } from '../ui/AutoTextarea.jsx';

export function AddCard({ listId, boardId, open, onOpenChange }) {
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);
  const create = useBoardMutation(boardId, (t) => cardApi.create(listId, t), {
    onSuccess: () => {
      setTitle('');
      inputRef.current?.focus();
    },
  });

  const submit = () => {
    const t = title.trim();
    if (t) create.mutate(t);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="m-2 mt-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-300/60"
      >
        <Plus size={16} /> Add a card
      </button>
    );
  }

  return (
    <div className="p-2 pt-1">
      <AutoTextarea
        ref={inputRef}
        autoFocus
        value={title}
        maxLength={500}
        onChange={(e) => setTitle(e.target.value)}
        onSubmit={submit}
        onCancel={() => onOpenChange(false)}
        placeholder="Enter a title for this card…"
        aria-label="Card title"
        className="w-full rounded-lg bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div className="mt-2 flex items-center gap-1">
        <button type="button" onClick={submit} className="btn-primary" disabled={!title.trim() || create.isPending}>
          Add card
        </button>
        <button type="button" onClick={() => onOpenChange(false)} aria-label="Cancel" className="btn-ghost px-2">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
