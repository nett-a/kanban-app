import { useEffect, useRef } from 'react';

/** Textarea that grows with its content. Enter submits unless `multiline`; Esc calls onCancel. */
export function AutoTextarea({ value, onSubmit, onCancel, multiline = false, className = '', ref, ...props }) {
  const innerRef = useRef(null);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const setRefs = (el) => {
    innerRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  return (
    <textarea
      {...props}
      ref={setRefs}
      value={value}
      rows={1}
      className={`resize-none overflow-hidden ${className}`}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSubmit?.();
        } else if (e.key === 'Escape' && onCancel) {
          e.stopPropagation();
          onCancel();
        }
      }}
    />
  );
}
