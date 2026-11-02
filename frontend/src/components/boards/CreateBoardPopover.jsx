import { useState } from 'react';
import { Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { boardApi } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { qk, useWorkspaces } from '../../hooks/queries.js';
import { BOARD_BACKGROUND_KEYS, backgroundClass } from '../../utils/theme.js';
import { Popover } from '../ui/Popover.jsx';

export function CreateBoardPopover({ anchor, open, onClose, defaultWorkspaceId, align }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { data: workspaces = [] } = useWorkspaces();
  const [title, setTitle] = useState('');
  const [background, setBackground] = useState('ocean');
  const [workspaceId, setWorkspaceId] = useState('');

  const effectiveWorkspaceId = workspaceId || defaultWorkspaceId || workspaces[0]?.id || '';

  const create = useMutation({
    mutationFn: () => boardApi.create({ title: title.trim(), background, workspaceId: effectiveWorkspaceId }),
    onSuccess: ({ board }) => {
      queryClient.invalidateQueries({ queryKey: qk.boards });
      setTitle('');
      onClose();
      navigate(`/b/${board.id}`);
    },
    onError: (err) => notify(err.message),
  });

  return (
    <Popover anchor={anchor} open={open} onClose={onClose} title="Create board" align={align}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate();
        }}
        className="space-y-3"
      >
        <div className={`flex h-24 items-center justify-center rounded-md ${backgroundClass(background)}`}>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-12 w-8 rounded bg-white/80" />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-slate-600">Background</p>
          <div className="grid grid-cols-8 gap-1.5">
            {BOARD_BACKGROUND_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setBackground(key)}
                aria-label={`Background ${key}`}
                aria-pressed={background === key}
                className={`flex h-8 items-center justify-center rounded ${backgroundClass(key)}`}
              >
                {background === key && <Check size={14} className="text-white drop-shadow" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="board-title" className="mb-1 block text-xs font-semibold text-slate-600">
            Board title <span className="text-red-500">*</span>
          </label>
          <input
            id="board-title"
            autoFocus
            className="input"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="board-workspace" className="mb-1 block text-xs font-semibold text-slate-600">
            Workspace
          </label>
          <select
            id="board-workspace"
            className="input"
            value={effectiveWorkspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={!title.trim() || !effectiveWorkspaceId || create.isPending}>
          {create.isPending ? 'Creating…' : 'Create'}
        </button>
      </form>
    </Popover>
  );
}
