import { useState } from 'react';
import { Clock, LayoutGrid, Plus, Star } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../api/index.js';
import { BoardTile } from '../components/boards/BoardTile.jsx';
import { CreateBoardPopover } from '../components/boards/CreateBoardPopover.jsx';
import { Popover } from '../components/ui/Popover.jsx';
import { usePopover } from '../hooks/usePopover.js';
import { FullPageSpinner } from '../components/ui/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { qk, useBoards, useWorkspaces } from '../hooks/queries.js';
import { getRecentBoardIds } from '../utils/storage.js';

function Section({ icon: Icon, title, children, action }) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={20} className="text-slate-600" />
        <h2 className="text-base font-bold text-slate-700">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{children}</div>
    </section>
  );
}

function NewBoardTile({ workspaceId }) {
  const pop = usePopover();
  return (
    <>
      <button
        {...pop.triggerProps}
        type="button"
        onClick={pop.toggle}
        className="flex h-24 items-center justify-center rounded-lg bg-slate-200/80 text-sm font-medium text-slate-600 hover:bg-slate-300/80"
      >
        Create new board
      </button>
      <CreateBoardPopover anchor={pop.anchor} open={pop.open} onClose={pop.close} defaultWorkspaceId={workspaceId} />
    </>
  );
}

function CreateWorkspaceButton() {
  const pop = usePopover();
  const [name, setName] = useState('');
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const create = useMutation({
    mutationFn: () => workspaceApi.create(name.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.workspaces });
      setName('');
      pop.close();
    },
    onError: (err) => notify(err.message),
  });

  return (
    <>
      <button {...pop.triggerProps} type="button" onClick={pop.toggle} className="btn-subtle">
        <Plus size={16} /> New workspace
      </button>
      <Popover anchor={pop.anchor} open={pop.open} onClose={pop.close} title="Create workspace" align="end">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.mutate();
          }}
          className="space-y-3"
        >
          <input
            autoFocus
            className="input"
            placeholder="Workspace name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            aria-label="Workspace name"
          />
          <button type="submit" className="btn-primary w-full" disabled={!name.trim() || create.isPending}>
            Create
          </button>
        </form>
      </Popover>
    </>
  );
}

export default function BoardsPage() {
  const { user } = useAuth();
  const { data: boards, isLoading } = useBoards();
  const { data: workspaces = [] } = useWorkspaces();

  if (isLoading) return <FullPageSpinner />;

  const starred = boards.filter((b) => b.starred);
  const recent = getRecentBoardIds(user.id)
    .map((id) => boards.find((b) => b.id === id))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-8 text-2xl font-bold text-slate-800">Hi {user.name.split(' ')[0]} 👋</h1>

        {starred.length > 0 && (
          <Section icon={Star} title="Starred boards">
            {starred.map((b) => (
              <BoardTile key={b.id} board={b} />
            ))}
          </Section>
        )}

        {recent.length > 0 && (
          <Section icon={Clock} title="Recently viewed">
            {recent.map((b) => (
              <BoardTile key={b.id} board={b} />
            ))}
          </Section>
        )}

        <div className="mb-4 flex items-center justify-between border-t border-slate-200 pt-8">
          <h2 className="section-title">Your workspaces</h2>
          <CreateWorkspaceButton />
        </div>

        {workspaces.map((ws) => {
          const wsBoards = boards.filter((b) => b.workspaceId === ws.id);
          return (
            <Section key={ws.id} icon={LayoutGrid} title={ws.name}>
              {wsBoards.map((b) => (
                <BoardTile key={b.id} board={b} />
              ))}
              <NewBoardTile workspaceId={ws.id} />
            </Section>
          );
        })}

        {/* Boards shared with the user from workspaces they don't belong to */}
        {(() => {
          const wsIds = new Set(workspaces.map((w) => w.id));
          const guest = boards.filter((b) => !wsIds.has(b.workspaceId));
          if (!guest.length) return null;
          return (
            <Section icon={LayoutGrid} title="Guest boards">
              {guest.map((b) => (
                <BoardTile key={b.id} board={b} />
              ))}
            </Section>
          );
        })()}
      </div>
    </div>
  );
}
