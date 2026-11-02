import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Floating panel anchored to the `anchor` element, rendered in a portal so it is
 * never clipped by scrolling lists or the card modal. Closes on outside click / Esc.
 */
export function Popover({ anchor, open, onClose, title, children, width = 304, align = 'start' }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchor) return undefined;
    const update = () => {
      const rect = anchor.getBoundingClientRect();
      const height = panelRef.current?.offsetHeight ?? 0;
      let left = align === 'end' ? rect.right - width : rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      let top = rect.bottom + 6;
      if (top + height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - height - 8);
      setPos({ top, left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchor, width, align]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (panelRef.current?.contains(e.target) || anchor?.contains(e.target)) return;
      onClose();
    };
    // Capture phase + stopPropagation so Esc closes only the popover, not the modal underneath.
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, onClose, anchor]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={title}
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width }}
      className="fixed z-[70] max-h-[80vh] overflow-y-auto rounded-lg bg-white p-3 text-slate-700 shadow-xl ring-1 ring-slate-900/10"
    >
      {title && (
        <div className="relative mb-3 flex items-center justify-center">
          <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-0 rounded p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {children}
    </div>,
    document.body,
  );
}
