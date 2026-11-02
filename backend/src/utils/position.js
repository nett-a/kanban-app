export const byPosition = (a, b) => a.position - b.position;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Rewrites `position` as 0..n-1 following the array order. */
export function reindex(items) {
  items.forEach((item, index) => {
    item.position = index;
  });
  return items;
}

/**
 * Inserts `item` into the already-sorted `siblings` (which must not contain it)
 * at `index`, then reindexes the whole list.
 */
export function insertAt(siblings, item, index) {
  const ordered = [...siblings];
  ordered.splice(clamp(index, 0, ordered.length), 0, item);
  return reindex(ordered);
}
