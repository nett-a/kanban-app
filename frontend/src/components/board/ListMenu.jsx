import { useState } from 'react';
import { Archive, Plus, Trash2 } from 'lucide-react';
import { listApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { qk, useBoardMutation } from '../../hooks/queries.js';
import { Popover } from '../ui/Popover.jsx';

export function ListMenu({ popover, list, board, onAddCard }) {
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOwner = board.ownerId === user.id;

  const archive = useBoardMutation(board.id, () => listApi.update(list.id, { archived: true }), {
    extraKeys: [qk.archived(board.id)],
  });
  const remove = useBoardMutation(board.id, () => listApi.remove(list.id));

  const close = () => {
    setConfirmDelete(false);
    popover.close();
  };

  return (
    <Popover anchor={popover.anchor} open={popover.open} onClose={close} title="List actions" width={260}>
      {confirmDelete ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Delete list <strong>{list.title}</strong> and all of its cards? This cannot be undone.
          </p>
          <button
            type="button"
            className="btn-danger w-full"
            onClick={() => {
              remove.mutate();
              close();
            }}
          >
            Delete list
          </button>
        </div>
      ) : (
        <ul className="-mx-3 text-sm">
          <li>
            <button type="button" onClick={onAddCard} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-100">
              <Plus size={16} /> Add card
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                archive.mutate();
                close();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-100"
            >
              <Archive size={16} /> Archive this list
            </button>
          </li>
          {isOwner && (
            <li>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} /> Delete list…
              </button>
            </li>
          )}
        </ul>
      )}
    </Popover>
  );
}
