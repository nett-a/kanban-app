import { Star } from 'lucide-react';
import { Link } from 'react-router';
import { useToggleStar } from '../../hooks/queries.js';
import { backgroundClass } from '../../utils/theme.js';

export function BoardTile({ board }) {
  const toggleStar = useToggleStar();
  return (
    <div className={`group relative h-24 overflow-hidden rounded-lg shadow-sm ${backgroundClass(board.background)}`}>
      <Link
        to={`/b/${board.id}`}
        className="absolute inset-0 bg-black/10 p-3 transition-colors group-hover:bg-black/25"
        aria-label={`Open board ${board.title}`}
      >
        <span className="line-clamp-2 font-bold text-white drop-shadow">{board.title}</span>
      </Link>
      <button
        type="button"
        onClick={() => toggleStar.mutate(board.id)}
        aria-label={board.starred ? `Unstar ${board.title}` : `Star ${board.title}`}
        className={`absolute right-2 bottom-2 rounded p-1 transition hover:scale-110 ${
          board.starred ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
        }`}
      >
        <Star size={16} className={board.starred ? 'fill-amber-400 text-amber-400' : 'text-white'} />
      </button>
    </div>
  );
}
