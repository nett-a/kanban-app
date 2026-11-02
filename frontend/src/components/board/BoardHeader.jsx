import clsx from 'clsx';
import { Ellipsis, ListFilter, Star, UserPlus } from 'lucide-react';
import { boardApi } from '../../api/index.js';
import { qk, useBoardMutation, useToggleStar } from '../../hooks/queries.js';
import { countActiveFilters } from '../../utils/filters.js';
import { AvatarStack } from '../ui/Avatar.jsx';
import { InlineEdit } from '../ui/InlineEdit.jsx';
import { usePopover } from '../../hooks/usePopover.js';
import { FilterPopover } from './FilterPopover.jsx';
import { InvitePopover } from './InvitePopover.jsx';

const headerBtn = 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-white hover:bg-white/20';

export function BoardHeader({ data, filters, onFiltersChange, onOpenMenu }) {
  const { board } = data;
  const toggleStar = useToggleStar();
  const filter = usePopover();
  const invite = usePopover();
  const rename = useBoardMutation(board.id, (title) => boardApi.update(board.id, { title }), { extraKeys: [qk.boards] });
  const activeFilters = countActiveFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-1 bg-black/20 px-3 py-2 backdrop-blur-sm sm:px-4">
      <InlineEdit
        value={board.title}
        onSave={(title) => rename.mutate(title)}
        ariaLabel="board title"
        maxLength={100}
        className="rounded-md px-2.5 py-1 text-lg font-bold text-white hover:bg-white/20"
        inputClassName="text-lg font-bold text-slate-800"
      />
      <button
        type="button"
        onClick={() => toggleStar.mutate(board.id)}
        aria-label={board.starred ? 'Unstar board' : 'Star board'}
        aria-pressed={board.starred}
        className={headerBtn}
      >
        <Star size={16} className={board.starred ? 'fill-amber-400 text-amber-400' : ''} />
      </button>
      {board.workspaceName && (
        <span className="hidden rounded-md bg-white/20 px-2.5 py-1 text-sm text-white sm:inline">{board.workspaceName}</span>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          {...filter.triggerProps}
          type="button"
          onClick={filter.toggle}
          className={clsx(headerBtn, activeFilters > 0 && 'bg-white text-slate-800 hover:bg-white/90')}
        >
          <ListFilter size={16} /> Filters
          {activeFilters > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white" data-testid="filter-count">
              {activeFilters}
            </span>
          )}
        </button>
        <FilterPopover popover={filter} board={board} filters={filters} onChange={onFiltersChange} />

        <span className="mx-1 hidden h-6 w-px bg-white/30 sm:block" />
        <div className="hidden sm:block" data-testid="board-members">
          <AvatarStack users={board.members} max={4} size="sm" />
        </div>

        <button
          {...invite.triggerProps}
          type="button"
          onClick={invite.toggle}
          className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-white/90"
        >
          <UserPlus size={16} /> Share
        </button>
        <InvitePopover popover={invite} board={board} />

        <button type="button" onClick={onOpenMenu} aria-label="Show menu" className={headerBtn}>
          <Ellipsis size={18} />
        </button>
      </div>
    </div>
  );
}
