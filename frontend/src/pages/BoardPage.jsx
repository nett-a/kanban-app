import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { BoardCanvas } from '../components/board/BoardCanvas.jsx';
import { BoardHeader } from '../components/board/BoardHeader.jsx';
import { BoardMenu } from '../components/board/BoardMenu.jsx';
import { CardModal } from '../components/card/CardModal.jsx';
import { FullPageSpinner } from '../components/ui/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useBoard } from '../hooks/queries.js';
import { EMPTY_FILTERS } from '../utils/filters.js';
import { pushRecentBoard } from '../utils/storage.js';
import { backgroundClass } from '../utils/theme.js';
import NotFoundPage from './NotFoundPage.jsx';

export default function BoardPage() {
  const { boardId } = useParams();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const openCardId = searchParams.get('card');
  const { data, isLoading, error } = useBoard(boardId);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [menuOpen, setMenuOpen] = useState(false);

  const loaded = Boolean(data);
  useEffect(() => {
    if (loaded) pushRecentBoard(user.id, boardId);
  }, [loaded, user.id, boardId]);

  useEffect(() => {
    if (data) document.title = `${data.board.title} | FlowBoard`;
    return () => {
      document.title = 'FlowBoard — Team Kanban';
    };
  }, [data]);

  const openCard = useCallback((cardId) => setSearchParams({ card: cardId }), [setSearchParams]);
  const closeCard = useCallback(() => setSearchParams({}), [setSearchParams]);

  if (isLoading) return <FullPageSpinner />;
  if (error || !data) return <NotFoundPage message="Board not found" />;

  return (
    <div className={`relative flex h-full flex-col ${backgroundClass(data.board.background)}`}>
      <BoardHeader data={data} filters={filters} onFiltersChange={setFilters} onOpenMenu={() => setMenuOpen(true)} />
      <BoardCanvas data={data} filters={filters} onOpenCard={openCard} />
      {menuOpen && <BoardMenu data={data} onClose={() => setMenuOpen(false)} onOpenCard={openCard} />}
      {openCardId && <CardModal cardId={openCardId} boardData={data} onClose={closeCard} />}
    </div>
  );
}
