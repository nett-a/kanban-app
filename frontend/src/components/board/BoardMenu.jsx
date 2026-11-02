import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Archive, ArchiveRestore, Check, ChevronLeft, Palette, Tag, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { boardApi, cardApi, listApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { qk, useBoardMutation } from '../../hooks/queries.js';
import { BOARD_BACKGROUND_KEYS, backgroundClass } from '../../utils/theme.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { ActivityFeed } from './ActivityFeed.jsx';
import { LabelManager } from './LabelManager.jsx';

const VIEWS = { main: 'Menu', activity: 'Activity', archived: 'Archived items', background: 'Change background', labels: 'Labels', delete: 'Delete board?' };

function ActivityView({ boardId }) {
  const { data, isLoading } = useQuery({ queryKey: qk.activities(boardId), queryFn: () => boardApi.activities(boardId) });
  if (isLoading) return <Spinner />;
  return <ActivityFeed activities={data.activities} />;
}

function ArchivedView({ boardId, onOpenCard }) {
  const [tab, setTab] = useState('cards');
  const { data, isLoading } = useQuery({ queryKey: qk.archived(boardId), queryFn: () => boardApi.archived(boardId) });
  const opts = { extraKeys: [qk.archived(boardId)] };
  const restoreCard = useBoardMutation(boardId, (id) => cardApi.update(id, { archived: false }), opts);
  const deleteCard = useBoardMutation(boardId, (id) => cardApi.remove(id), opts);
  const restoreList = useBoardMutation(boardId, (id) => listApi.update(id, { archived: false }), opts);

  if (isLoading) return <Spinner />;
  const items = tab === 'cards' ? data.cards : data.lists;

  return (
    <div>
      <div className="mb-3 flex gap-1">
        {['cards', 'lists'].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={tab === t ? 'btn-primary' : 'btn-subtle'}>
            {t === 'cards' ? 'Cards' : 'Lists'}
          </button>
        ))}
      </div>
      {!items.length && <p className="text-sm text-slate-500">No archived {tab}.</p>}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200">
            {tab === 'cards' ? (
              <button type="button" className="block w-full text-left text-sm font-medium hover:underline" onClick={() => onOpenCard(item.id)}>
                {item.title}
                <span className="block text-xs font-normal text-slate-500">in {item.listTitle}</span>
              </button>
            ) : (
              <p className="text-sm font-medium">{item.title}</p>
            )}
            <div className="mt-2 flex gap-3 text-xs">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-slate-600 hover:underline"
                onClick={() => (tab === 'cards' ? restoreCard : restoreList).mutate(item.id)}
              >
                <ArchiveRestore size={14} /> Restore
              </button>
              {tab === 'cards' && (
                <button type="button" className="inline-flex items-center gap-1 text-red-600 hover:underline" onClick={() => deleteCard.mutate(item.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BackgroundView({ board }) {
  const update = useBoardMutation(board.id, (background) => boardApi.update(board.id, { background }), { extraKeys: [qk.boards] });
  return (
    <div className="grid grid-cols-2 gap-2">
      {BOARD_BACKGROUND_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => update.mutate(key)}
          aria-label={`Background ${key}`}
          className={`flex h-20 items-center justify-center rounded-lg ${backgroundClass(key)}`}
        >
          {board.background === key && <Check className="text-white drop-shadow" />}
        </button>
      ))}
    </div>
  );
}

function DeleteView({ board }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const remove = useMutation({
    mutationFn: () => boardApi.remove(board.id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: qk.board(board.id) });
      queryClient.invalidateQueries({ queryKey: qk.boards });
      navigate('/');
    },
    onError: (err) => notify(err.message),
  });
  return (
    <div className="space-y-3 text-sm text-slate-600">
      <p>
        All lists, cards, comments and attachments of <strong>{board.title}</strong> will be permanently deleted. There is no undo.
      </p>
      <button type="button" className="btn-danger w-full" onClick={() => remove.mutate()} disabled={remove.isPending}>
        Delete board permanently
      </button>
    </div>
  );
}

export function BoardMenu({ data, onClose, onOpenCard }) {
  const { board } = data;
  const { user } = useAuth();
  const [view, setView] = useState('main');
  const isOwner = board.ownerId === user.id;
  const owner = board.members.find((m) => m.id === board.ownerId);

  const item = (icon, label, target, extra = '') => {
    const Icon = icon;
    return (
      <button type="button" onClick={() => setView(target)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-slate-200/70 ${extra}`}>
        <Icon size={16} /> {label}
      </button>
    );
  };

  return (
    <aside
      aria-label="Board menu"
      className="absolute top-0 right-0 bottom-0 z-40 flex w-full max-w-sm flex-col bg-slate-50 shadow-2xl"
    >
      <header className="relative flex items-center justify-center border-b border-slate-200 px-4 py-3">
        {view !== 'main' && (
          <button type="button" onClick={() => setView('main')} aria-label="Back" className="absolute left-3 rounded p-1 hover:bg-slate-200">
            <ChevronLeft size={18} />
          </button>
        )}
        <h2 className="text-sm font-semibold text-slate-700">{VIEWS[view]}</h2>
        <button type="button" onClick={onClose} aria-label="Close menu" className="absolute right-3 rounded p-1 hover:bg-slate-200">
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {view === 'main' && (
          <div className="space-y-1">
            <div className="mb-4 rounded-lg bg-white p-3 text-sm shadow-sm ring-1 ring-slate-200">
              <p className="section-title mb-2">Board owner</p>
              <div className="flex items-center gap-2">
                <Avatar user={owner} size="sm" />
                <span>{owner?.name}</span>
              </div>
            </div>
            {item(Activity, 'Activity', 'activity')}
            {item(Archive, 'Archived items', 'archived')}
            {item(Palette, 'Change background', 'background')}
            {item(Tag, 'Labels', 'labels')}
            {isOwner && item(Trash2, 'Delete board', 'delete', 'text-red-600')}
          </div>
        )}
        {view === 'activity' && <ActivityView boardId={board.id} />}
        {view === 'archived' && <ArchivedView boardId={board.id} onOpenCard={onOpenCard} />}
        {view === 'background' && <BackgroundView board={board} />}
        {view === 'labels' && <LabelManager board={board} />}
        {view === 'delete' && <DeleteView board={board} />}
      </div>
    </aside>
  );
}
