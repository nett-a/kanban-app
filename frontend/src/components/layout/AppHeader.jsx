import { ChevronDown, LogOut, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { useBoards, useToggleStar } from '../../hooks/queries.js';
import { getRecentBoardIds } from '../../utils/storage.js';
import { backgroundClass } from '../../utils/theme.js';
import { CreateBoardPopover } from '../boards/CreateBoardPopover.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Logo } from '../ui/Logo.jsx';
import { usePopover } from '../../hooks/usePopover.js';
import { Popover } from '../ui/Popover.jsx';
import { SearchBox } from './SearchBox.jsx';

function BoardMenuList({ boards, empty, onPick }) {
  const toggleStar = useToggleStar();
  if (!boards.length) return <p className="px-1 py-4 text-center text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-1">
      {boards.map((b) => (
        <li key={b.id} className="group flex items-center gap-2 rounded-md p-1 hover:bg-slate-100">
          <button type="button" onClick={() => onPick(b.id)} className="flex flex-1 items-center gap-2 text-left">
            <span className={`h-8 w-10 shrink-0 rounded ${backgroundClass(b.background)}`} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-slate-700">{b.title}</span>
              <span className="block truncate text-xs text-slate-500">{b.workspaceName}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => toggleStar.mutate(b.id)}
            aria-label={b.starred ? 'Unstar board' : 'Star board'}
            className="p-1"
          >
            <Star size={16} className={b.starred ? 'fill-amber-400 text-amber-400' : 'text-slate-400 group-hover:text-slate-600'} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function HeaderDropdown({ label, title, children }) {
  const pop = usePopover();
  return (
    <>
      <button
        {...pop.triggerProps}
        type="button"
        onClick={pop.toggle}
        className="hidden items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/15 md:inline-flex"
      >
        {label} <ChevronDown size={16} />
      </button>
      <Popover anchor={pop.anchor} open={pop.open} onClose={pop.close} title={title}>
        {children(pop.close)}
      </Popover>
    </>
  );
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: boards = [] } = useBoards();
  const create = usePopover();
  const account = usePopover();

  const recentIds = getRecentBoardIds(user.id);
  const recent = recentIds.map((id) => boards.find((b) => b.id === id)).filter(Boolean);
  const starred = boards.filter((b) => b.starred);

  const goTo = (close) => (id) => {
    close();
    navigate(`/b/${id}`);
  };

  return (
    <header className="relative z-30 flex h-12 shrink-0 items-center gap-1 bg-brand-600 px-2 text-white shadow-sm sm:px-3">
      <Link to="/" className="mr-2 rounded-md px-2 py-1 hover:bg-white/15" aria-label="Home">
        <Logo light className="text-lg" />
      </Link>

      <HeaderDropdown label="Recent" title="Recent boards">
        {(close) => <BoardMenuList boards={recent} empty="No recently viewed boards" onPick={goTo(close)} />}
      </HeaderDropdown>
      <HeaderDropdown label="Starred" title="Starred boards">
        {(close) => <BoardMenuList boards={starred} empty="Star important boards to find them quickly" onPick={goTo(close)} />}
      </HeaderDropdown>

      <button
        {...create.triggerProps}
        type="button"
        onClick={create.toggle}
        className="ml-1 rounded-md bg-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/30"
      >
        Create
      </button>
      <CreateBoardPopover anchor={create.anchor} open={create.open} onClose={create.close} />

      <div className="ml-auto flex items-center gap-2">
        <SearchBox />
        <button
          {...account.triggerProps}
          type="button"
          onClick={account.toggle}
          aria-label="Account menu"
          className="rounded-full p-0.5 hover:bg-white/20"
        >
          <Avatar user={user} size="sm" className="ring-0" />
        </button>
        <Popover anchor={account.anchor} open={account.open} onClose={account.close} title="Account" align="end" width={260}>
          <div className="mb-3 flex items-center gap-3 border-b border-slate-200 pb-3">
            <Avatar user={user} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button type="button" onClick={logout} className="btn-ghost w-full justify-start">
            <LogOut size={16} /> Log out
          </button>
        </Popover>
      </div>
    </header>
  );
}
