import { useState } from 'react';
import { Crown, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { boardApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { qk, useBoardMutation, useUsers } from '../../hooks/queries.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Popover } from '../ui/Popover.jsx';

export function InvitePopover({ popover, board }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data: users = [] } = useUsers('');
  const isOwner = board.ownerId === user.id;
  const memberIds = new Set(board.members.map((m) => m.id));

  const add = useBoardMutation(board.id, (userId) => boardApi.addMember(board.id, userId), { extraKeys: [qk.boards] });
  const remove = useBoardMutation(board.id, (userId) => boardApi.removeMember(board.id, userId), {
    extraKeys: [qk.boards],
    onSuccess: (_data, userId) => userId === user.id && navigate('/'),
  });

  const term = q.trim().toLowerCase();
  const candidates = users.filter(
    (u) => !memberIds.has(u.id) && (!term || u.name.toLowerCase().includes(term) || u.username.includes(term)),
  );

  return (
    <Popover anchor={popover.anchor} open={popover.open} onClose={popover.close} title="Share board" align="end" width={340}>
      <input
        className="input mb-3"
        placeholder="Search people by name or username"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search people to invite"
      />

      {candidates.length > 0 && (
        <ul className="mb-4 space-y-1">
          {candidates.map((u) => (
            <li key={u.id} className="flex items-center gap-2 rounded-md p-1 hover:bg-slate-50">
              <Avatar user={u} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{u.name}</span>
                <span className="block truncate text-xs text-slate-500">@{u.username}</span>
              </span>
              <button type="button" className="btn-primary px-2 py-1 text-xs" onClick={() => add.mutate(u.id)} disabled={add.isPending}>
                Add
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="section-title mb-2">Board members</p>
      <ul className="space-y-1">
        {board.members.map((m) => (
          <li key={m.id} className="flex items-center gap-2 rounded-md p-1">
            <Avatar user={m} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {m.name} {m.id === user.id && <span className="text-slate-400">(you)</span>}
              </span>
              <span className="block truncate text-xs text-slate-500">@{m.username}</span>
            </span>
            {m.id === board.ownerId ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <Crown size={14} /> Owner
              </span>
            ) : (
              (isOwner || m.id === user.id) && (
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-xs"
                  onClick={() => remove.mutate(m.id)}
                  aria-label={m.id === user.id ? 'Leave board' : `Remove ${m.name}`}
                >
                  <UserMinus size={14} /> {m.id === user.id ? 'Leave' : 'Remove'}
                </button>
              )
            )}
          </li>
        ))}
      </ul>
    </Popover>
  );
}
