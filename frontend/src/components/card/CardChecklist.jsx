import { useState } from 'react';
import { SquareCheck, Trash2, X } from 'lucide-react';
import { cardApi } from '../../api/index.js';
import { useBoardMutation } from '../../hooks/queries.js';
import { AutoTextarea } from '../ui/AutoTextarea.jsx';
import { InlineEdit } from '../ui/InlineEdit.jsx';

export function CardChecklist({ checklist, cardId, boardId }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [hideDone, setHideDone] = useState(false);
  const opts = { cardId };

  const rename = useBoardMutation(boardId, (title) => cardApi.updateChecklist(cardId, checklist.id, title), opts);
  const remove = useBoardMutation(boardId, () => cardApi.deleteChecklist(cardId, checklist.id), opts);
  const addItem = useBoardMutation(boardId, (t) => cardApi.addItem(cardId, checklist.id, t), {
    ...opts,
    onSuccess: () => setText(''),
  });
  const updateItem = useBoardMutation(boardId, ({ itemId, ...data }) => cardApi.updateItem(cardId, checklist.id, itemId, data), {
    ...opts,
    optimistic: (card, { itemId, ...data }) => ({
      ...card,
      checklists: card.checklists.map((cl) =>
        cl.id === checklist.id ? { ...cl, items: cl.items.map((i) => (i.id === itemId ? { ...i, ...data } : i)) } : cl,
      ),
    }),
  });
  const deleteItem = useBoardMutation(boardId, (itemId) => cardApi.deleteItem(cardId, checklist.id, itemId), opts);

  const total = checklist.items.length;
  const done = checklist.items.filter((i) => i.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const items = hideDone ? checklist.items.filter((i) => !i.done) : checklist.items;

  const submit = () => {
    const t = text.trim();
    if (t) addItem.mutate(t);
  };

  return (
    <section className="mb-6" aria-label={`Checklist ${checklist.title}`} data-testid="checklist">
      <div className="mb-2 flex items-center gap-3">
        <SquareCheck size={20} className="shrink-0 text-slate-600" />
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={checklist.title}
            onSave={(t) => rename.mutate(t)}
            ariaLabel="checklist title"
            className="w-full rounded px-1 font-semibold text-slate-700 hover:bg-slate-200/60"
            inputClassName="w-full font-semibold"
          />
        </div>
        {done > 0 && (
          <button type="button" className="btn-subtle text-xs" onClick={() => setHideDone((h) => !h)}>
            {hideDone ? `Show checked items (${done})` : 'Hide checked items'}
          </button>
        )}
        <button type="button" className="btn-subtle text-xs" onClick={() => remove.mutate()}>
          Delete
        </button>
      </div>

      <div className="mb-2 flex items-center gap-3">
        <span className="w-8 text-right text-xs text-slate-500" data-testid="checklist-progress">
          {percent}%
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full transition-all ${percent === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <ul className="ml-8 space-y-0.5">
        {items.map((item) => (
          <li key={item.id} className="group flex items-start gap-2 rounded-md px-1 py-1 hover:bg-slate-200/50">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
              checked={item.done}
              onChange={() => updateItem.mutate({ itemId: item.id, done: !item.done })}
              aria-label={`Checklist item ${item.text}`}
            />
            <div className="min-w-0 flex-1">
              <InlineEdit
                value={item.text}
                onSave={(t) => updateItem.mutate({ itemId: item.id, text: t })}
                ariaLabel="checklist item"
                maxLength={500}
                className={`w-full text-sm ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                inputClassName="w-full text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => deleteItem.mutate(item.id)}
              aria-label={`Delete item "${item.text}"`}
              className="rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-300/60 hover:text-slate-700 focus:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-2 ml-8">
        {adding ? (
          <div>
            <AutoTextarea
              autoFocus
              value={text}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
              onSubmit={submit}
              onCancel={() => setAdding(false)}
              placeholder="Add an item"
              aria-label="New checklist item"
              className="input"
            />
            <div className="mt-2 flex gap-1">
              <button type="button" className="btn-primary" onClick={submit} disabled={!text.trim()}>
                Add
              </button>
              <button type="button" className="btn-ghost px-2" onClick={() => setAdding(false)} aria-label="Cancel">
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn-subtle" onClick={() => setAdding(true)}>
            Add an item
          </button>
        )}
      </div>
    </section>
  );
}
