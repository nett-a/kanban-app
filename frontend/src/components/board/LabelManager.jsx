import { useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { boardApi } from '../../api/index.js';
import { useBoardMutation } from '../../hooks/queries.js';
import { LABEL_COLOR_KEYS, labelClass } from '../../utils/theme.js';

/** Form to create or edit a label (name + colour). */
export function LabelEditor({ initial, onSave, onDelete, onCancel, saving }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? 'green');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name: name.trim(), color });
      }}
      className="space-y-3"
    >
      <div className={`flex h-9 items-center rounded px-3 text-sm font-medium text-white ${labelClass(color)}`}>{name || ' '}</div>
      <div>
        <label htmlFor="label-name" className="mb-1 block text-xs font-semibold text-slate-600">
          Title
        </label>
        <input id="label-name" autoFocus className="input" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold text-slate-600">Select a color</p>
        <div className="grid grid-cols-5 gap-1.5">
          {LABEL_COLOR_KEYS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={`flex h-8 items-center justify-center rounded ${labelClass(c)}`}
            >
              {color === c && <Check size={14} className="text-white" />}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {initial ? 'Save' : 'Create'}
        </button>
        {onDelete && (
          <button type="button" className="btn-danger" onClick={onDelete}>
            Delete
          </button>
        )}
        {onCancel && (
          <button type="button" className="btn-subtle" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function LabelManager({ board }) {
  const [editing, setEditing] = useState(null); // label object | 'new' | null
  const done = { onSuccess: () => setEditing(null) };
  const create = useBoardMutation(board.id, (data) => boardApi.createLabel(board.id, data), done);
  const update = useBoardMutation(board.id, ({ id, ...data }) => boardApi.updateLabel(board.id, id, data), done);
  const remove = useBoardMutation(board.id, (id) => boardApi.deleteLabel(board.id, id), done);

  if (editing) {
    return (
      <LabelEditor
        initial={editing === 'new' ? null : editing}
        saving={create.isPending || update.isPending}
        onCancel={() => setEditing(null)}
        onDelete={editing === 'new' ? undefined : () => remove.mutate(editing.id)}
        onSave={(data) => (editing === 'new' ? create.mutate(data) : update.mutate({ id: editing.id, ...data }))}
      />
    );
  }

  return (
    <div className="space-y-2">
      {board.labels.map((l) => (
        <div key={l.id} className="flex items-center gap-2">
          <span className={`h-8 flex-1 rounded px-3 text-sm leading-8 font-medium text-white ${labelClass(l.color)}`}>{l.name}</span>
          <button type="button" onClick={() => setEditing(l)} aria-label={`Edit label ${l.name || l.color}`} className="rounded p-2 hover:bg-slate-200">
            <Pencil size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="btn-subtle mt-2 w-full" onClick={() => setEditing('new')}>
        Create a new label
      </button>
    </div>
  );
}
