import { useState } from 'react';
import { AlignLeft } from 'lucide-react';
import { AutoTextarea } from '../ui/AutoTextarea.jsx';

export function CardDescription({ card, update }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.description);

  const start = () => {
    setDraft(card.description);
    setEditing(true);
  };

  const save = () => {
    if (draft !== card.description) update.mutate({ description: draft });
    setEditing(false);
  };

  return (
    <section className="mb-6" aria-label="Description">
      <div className="mb-2 flex items-center gap-3">
        <AlignLeft size={20} className="text-slate-600" />
        <h3 className="flex-1 font-semibold text-slate-700">Description</h3>
        {card.description && !editing && (
          <button type="button" className="btn-subtle text-xs" onClick={start}>
            Edit
          </button>
        )}
      </div>
      <div className="ml-8">
        {editing ? (
          <>
            <AutoTextarea
              multiline
              autoFocus
              value={draft}
              maxLength={10000}
              onChange={(e) => setDraft(e.target.value)}
              onCancel={() => setEditing(false)}
              className="input min-h-28"
              placeholder="Add a more detailed description…"
              aria-label="Description"
            />
            <div className="mt-2 flex gap-1">
              <button type="button" className="btn-primary" onClick={save}>
                Save
              </button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </>
        ) : card.description ? (
          <button type="button" onClick={start} className="w-full text-left text-sm whitespace-pre-wrap text-slate-700" data-testid="card-description">
            {card.description}
          </button>
        ) : (
          <button type="button" onClick={start} className="block min-h-14 w-full rounded-md bg-slate-200/70 px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-300/70">
            Add a more detailed description…
          </button>
        )}
      </div>
    </section>
  );
}
