import { EMPTY_FILTERS, countActiveFilters } from '../../utils/filters.js';
import { labelClass } from '../../utils/theme.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Popover } from '../ui/Popover.jsx';

const DUE_OPTIONS = [
  { value: 'none', label: 'No dates' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'soon', label: 'Due in the next day' },
  { value: 'complete', label: 'Marked as complete' },
];

const toggleIn = (arr, value) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

export function FilterPopover({ popover, board, filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <Popover anchor={popover.anchor} open={popover.open} onClose={popover.close} title="Filter" align="end" width={320}>
      <div className="space-y-4 text-sm">
        <div>
          <label htmlFor="filter-keyword" className="mb-1 block text-xs font-semibold text-slate-600">
            Keyword
          </label>
          <input
            id="filter-keyword"
            className="input"
            placeholder="Enter a keyword…"
            value={filters.keyword}
            onChange={(e) => set({ keyword: e.target.value })}
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-slate-600">Members</legend>
          {board.members.map((m) => (
            <label key={m.id} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-50">
              <input type="checkbox" aria-label={`Filter by member ${m.name}`} checked={filters.memberIds.includes(m.id)} onChange={() => set({ memberIds: toggleIn(filters.memberIds, m.id) })} />
              <Avatar user={m} size="xs" />
              {m.name}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-slate-600">Due date</legend>
          {DUE_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-50">
              <input type="checkbox" aria-label={`Filter: ${o.label}`} checked={filters.due === o.value} onChange={() => set({ due: filters.due === o.value ? null : o.value })} />
              {o.label}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-slate-600">Labels</legend>
          {board.labels.map((l) => (
            <label key={l.id} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-50">
              <input type="checkbox" aria-label={`Filter by label ${l.name || l.color}`} checked={filters.labelIds.includes(l.id)} onChange={() => set({ labelIds: toggleIn(filters.labelIds, l.id) })} />
              <span className={`h-6 flex-1 rounded px-2 text-xs leading-6 font-medium text-white ${labelClass(l.color)}`}>{l.name}</span>
            </label>
          ))}
        </fieldset>

        {countActiveFilters(filters) > 0 && (
          <button type="button" className="btn-subtle w-full" onClick={() => onChange(EMPTY_FILTERS)}>
            Clear all filters
          </button>
        )}
      </div>
    </Popover>
  );
}
