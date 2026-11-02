import { useState } from 'react';

/** State for one popover: spread `triggerProps` on the trigger, pass `anchor` to <Popover>. */
export function usePopover() {
  const [anchor, setAnchor] = useState(null);
  const [open, setOpen] = useState(false);
  return {
    anchor,
    triggerProps: { ref: setAnchor },
    open,
    toggle: () => setOpen((o) => !o),
    close: () => setOpen(false),
    setOpen,
  };
}
