import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { boardApi, cardApi } from '../../api/index.js';
import { useBoardMutation } from '../../hooks/queries.js';
import { toLocalInputValue } from '../../utils/date.js';
import { LABEL_COLOR_KEYS, labelClass } from '../../utils/theme.js';
import { LabelEditor } from '../board/LabelManager.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Popover } from '../ui/Popover.jsx';

const toggleIn = (arr, value) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

export function MembersPopover({ popover, card, board, update }) {
  return (
    <Popover anchor={popover.anchor} open={popover.open} onClose={popover.close} title="Members">
      <p className="section-title mb-2">Board members</p>
      <ul className="space-y-1">
        {board.members.map((m) => {
          const selected = card.memberIds.includes(m.id);
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => update.mutate({ memberIds: toggleIn(card.memberIds, m.id) })}
                className="flex w-full items-center gap-2 rounded-md p-1.5 text-left text-sm hover:bg-slate-100"
                aria-pressed={selected}
              >
                <Avatar user={m} size="sm" />
                <span className="flex-1">{m.name}</span>
                {selected && <Check size={16} className="text-brand-600" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Popover>
  );
}

export function LabelsPopover({ popover, card, board, update }) {
  const [creating, setCreating] = useState(false);
  const createLabel = useBoardMutation(board.id, (data) => boardApi.createLabel(board.id, data), {
    cardId: card.id,
    onSuccess: ({ label }) => {
      setCreating(false);
      update.mutate({ labelIds: [...card.labelIds, label.id] });
    },
  });

  const close = () => {
    setCreating(false);
    popover.close();
  };

  return (
    <Popover anchor={popover.anchor} open={popover.open} onClose={close} title={creating ? 'Create label' : 'Labels'}>
      {creating ? (
        <LabelEditor onSave={(data) => createLabel.mutate(data)} onCancel={() => setCreating(false)} saving={createLabel.isPending} />
      ) : (
        <>
          <ul className="space-y-1.5">
            {board.labels.map((l) => (
              <li key={l.id}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={card.labelIds.includes(l.id)}
                    onChange={() => update.mutate({ labelIds: toggleIn(card.labelIds, l.id) })}
                    aria-label={`Label ${l.name || l.color}`}
                  />
                  <span className={`h-8 flex-1 rounded px-3 text-sm leading-8 font-medium text-white ${labelClass(l.color)}`}>{l.name}</span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-subtle mt-3 w-full" onClick={() => setCreating(true)}>
            Create a new label
          </button>
        </>
      )}
    </Popover>
  );
}

export function DatesPopover({ popover, card, update }) {
  const [start, setStart] = useState(toLocalInputValue(card.startDate));
  const [due, setDue] = useState(toLocalInputValue(card.dueDate));
  const toIso = (v) => (v ? new Date(v).toISOString() : null);

  return (
    <Popover anchor={popover.anchor} open={popover.open} onClose={popover.close} title="Dates">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate({ startDate: toIso(start), dueDate: toIso(due) });
          popover.close();
        }}
      >
        <div>
          <label htmlFor="start-date" className="mb-1 block text-xs font-semibold text-slate-600">
            Start date
          </label>
          <input id="start-date" type="datetime-local" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label htmlFor="due-date" className="mb-1 block text-xs font-semibold text-slate-600">
            Due date
          </label>
          <input id="due-date" type="datetime-local" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary w-full">
          Save
        </button>
        <button
          type="button"
          className="btn-subtle w-full"
          onClick={() => {
            update.mutate({ startDate: null, dueDate: null, dueComplete: false });
            popover.close();
          }}
        >
          Remove dates
        </button>
      </form>
    </Popover>
  );
}

export function ChecklistPopover({ popover, card, boardId }) {
  const [title, setTitle] = useState('Checklist');
  const add = useBoardMutation(boardId, (t) => cardApi.addChecklist(card.id, t), {
    cardId: card.id,
    onSuccess: () => {
      setTitle('Checklist');
      popover.close();
    },
  });
  return (
    <Popover anchor={popover.anchor} open={popover.open} onClose={popover.close} title="Add checklist">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) add.mutate(title.trim());
        }}
      >
        <label htmlFor="checklist-title" className="block text-xs font-semibold text-slate-600">
          Title
        </label>
        <input id="checklist-title" autoFocus className="input" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit" className="btn-primary w-full" disabled={!title.trim() || add.isPending}>
          Add
        </button>
      </form>
    </Popover>
  );
}

export function AttachmentPopover({ popover, card, boardId }) {
  const inputRef = useRef(null);
  const upload = useBoardMutation(boardId, (file) => cardApi.uploadAttachment(card.id, file), {
    cardId: card.id,
    onSuccess: () => popover.close(),
  });
  return (
    <Popover anchor={popover.anchor} open={popover.open} onClose={popover.close} title="Attach">
      <p className="mb-3 text-xs text-slate-500">Images, PDF, Office documents, text, CSV or ZIP — max 10 MB.</p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        data-testid="attachment-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
          e.target.value = '';
        }}
      />
      <button type="button" className="btn-primary w-full" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
        {upload.isPending ? 'Uploading…' : 'Choose a file from your computer'}
      </button>
    </Popover>
  );
}

export function CoverPopover({ popover, card, update }) {
  return (
    <Popover anchor={popover.anchor} open={popover.open} onClose={popover.close} title="Cover">
      <div className="grid grid-cols-5 gap-1.5">
        {LABEL_COLOR_KEYS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => update.mutate({ cover: c })}
            aria-label={`Cover ${c}`}
            aria-pressed={card.cover === c}
            className={`flex h-10 items-center justify-center rounded ${labelClass(c)}`}
          >
            {card.cover === c && <Check size={16} className="text-white" />}
          </button>
        ))}
      </div>
      {card.cover && (
        <button type="button" className="btn-subtle mt-3 w-full" onClick={() => update.mutate({ cover: null })}>
          Remove cover
        </button>
      )}
    </Popover>
  );
}

export function MovePopover({ popover, card, lists, cardsInList, move }) {
  const [listId, setListId] = useState(card.listId);
  const count = cardsInList(listId).filter((c) => c.id !== card.id).length;
  const currentIndex = cardsInList(card.listId).findIndex((c) => c.id === card.id);
  const [position, setPosition] = useState(Math.max(currentIndex, 0));

  return (
    <Popover anchor={popover.anchor} open={popover.open} onClose={popover.close} title="Move card">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          move.mutate({ listId, index: Math.min(position, count) });
          popover.close();
        }}
      >
        <div>
          <label htmlFor="move-list" className="mb-1 block text-xs font-semibold text-slate-600">
            List
          </label>
          <select
            id="move-list"
            className="input"
            value={listId}
            onChange={(e) => {
              setListId(e.target.value);
              setPosition(0);
            }}
          >
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
                {l.id === card.listId ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="move-position" className="mb-1 block text-xs font-semibold text-slate-600">
            Position
          </label>
          <select id="move-position" className="input" value={position} onChange={(e) => setPosition(Number(e.target.value))}>
            {Array.from({ length: count + 1 }, (_, i) => (
              <option key={i} value={i}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary w-full">
          Move
        </button>
      </form>
    </Popover>
  );
}
