import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { userApi } from '../../api/index.js';
import { backgroundClass } from '../../utils/theme.js';
import { Popover } from '../ui/Popover.jsx';

export function SearchBox() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ boards: [], cards: [] });

  // Debounced search; aborts the previous request when typing continues.
  useEffect(() => {
    const term = q.trim();
    if (!term) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      userApi
        .search(term, controller.signal)
        .then(setResults)
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const go = (path) => {
    setOpen(false);
    setQ('');
    navigate(path);
  };

  const hasResults = results.boards.length > 0 || results.cards.length > 0;

  return (
    <div ref={setAnchor} className="relative">
      <Search size={16} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-white/80" />
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search"
        aria-label="Search boards and cards"
        className="h-8 w-36 rounded-md border border-white/30 bg-white/20 pr-3 pl-8 text-sm text-white placeholder:text-white/80 outline-none focus:w-64 focus:bg-white focus:text-slate-800 focus:placeholder:text-slate-400 sm:w-52 transition-all"
      />
      <Popover anchor={anchor} open={open && q.trim().length > 0} onClose={() => setOpen(false)} width={340} align="end">
        {!hasResults && <p className="py-4 text-center text-sm text-slate-500">No results for “{q}”</p>}
        {results.cards.length > 0 && (
          <div className="mb-3">
            <p className="section-title mb-1 px-1">Cards</p>
            <ul>
              {results.cards.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => go(`/b/${c.boardId}?card=${c.id}`)}
                    className="w-full rounded-md px-2 py-1.5 text-left hover:bg-slate-100"
                  >
                    <span className="block truncate text-sm font-medium">{c.title}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {c.boardTitle} · {c.listTitle}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {results.boards.length > 0 && (
          <div>
            <p className="section-title mb-1 px-1">Boards</p>
            <ul>
              {results.boards.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => go(`/b/${b.id}`)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-100"
                  >
                    <span className={`h-6 w-8 shrink-0 rounded ${backgroundClass(b.background)}`} />
                    <span className="truncate text-sm font-medium">{b.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Popover>
    </div>
  );
}
