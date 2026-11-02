import { useState } from 'react';
import { AutoTextarea } from './AutoTextarea.jsx';

/**
 * Text that turns into a textarea on click and saves on Enter / blur.
 * Used for board, list and card titles.
 */
export function InlineEdit({ value, onSave, className = '', inputClassName = '', ariaLabel, maxLength = 200 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== value) onSave(next);
  };

  if (!editing) {
    return (
      <button type="button" onClick={start} className={`text-left ${className}`} aria-label={ariaLabel ? `Edit ${ariaLabel}` : undefined}>
        {value}
      </button>
    );
  }

  return (
    <AutoTextarea
      autoFocus
      value={draft}
      maxLength={maxLength}
      aria-label={ariaLabel}
      onChange={(e) => setDraft(e.target.value)}
      onSubmit={commit}
      onCancel={() => setEditing(false)}
      onBlur={commit}
      onFocus={(e) => e.target.select()}
      className={`rounded-md bg-white px-2 py-1 outline-none ring-2 ring-brand-500 ${inputClassName}`}
    />
  );
}
