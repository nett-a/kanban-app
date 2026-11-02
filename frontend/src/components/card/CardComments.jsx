import { useState } from 'react';
import { List } from 'lucide-react';
import { cardApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useBoardMutation } from '../../hooks/queries.js';
import { formatDateTime, timeAgo } from '../../utils/date.js';
import { ActivityFeed } from '../board/ActivityFeed.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { AutoTextarea } from '../ui/AutoTextarea.jsx';

function Comment({ comment, isMine, cardId, boardId }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const update = useBoardMutation(boardId, (t) => cardApi.updateComment(comment.id, t), {
    cardId,
    onSuccess: () => setEditing(false),
  });
  const remove = useBoardMutation(boardId, () => cardApi.deleteComment(comment.id), { cardId });

  return (
    <li className="flex gap-2" data-testid="comment">
      <Avatar user={comment.user} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold">{comment.user?.name}</span>{' '}
          <span className="text-xs text-slate-500" title={formatDateTime(comment.createdAt)}>
            {timeAgo(comment.createdAt)}
            {comment.edited && ' (edited)'}
          </span>
        </p>
        {editing ? (
          <div className="mt-1">
            <AutoTextarea multiline autoFocus value={text} maxLength={5000} onChange={(e) => setText(e.target.value)} className="input" aria-label="Edit comment" />
            <div className="mt-2 flex gap-1">
              <button type="button" className="btn-primary" disabled={!text.trim()} onClick={() => update.mutate(text.trim())}>
                Save
              </button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Rendered as plain text — React escapes it, so user content can never inject HTML. */}
            <p className="mt-1 rounded-lg bg-white px-3 py-2 text-sm whitespace-pre-wrap text-slate-700 shadow-sm ring-1 ring-slate-200">
              {comment.text}
            </p>
            {isMine && (
              <div className="mt-1 flex gap-2 text-xs text-slate-500">
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => {
                    setText(comment.text);
                    setEditing(true);
                  }}
                >
                  Edit
                </button>
                ·
                <button type="button" className="hover:underline" onClick={() => remove.mutate()}>
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
}

export function CardComments({ card, boardId }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const add = useBoardMutation(boardId, (t) => cardApi.addComment(card.id, t), {
    cardId: card.id,
    onSuccess: () => {
      setText('');
      setFocused(false);
    },
  });

  return (
    <section aria-label="Activity">
      <div className="mb-3 flex items-center gap-3">
        <List size={20} className="text-slate-600" />
        <h3 className="flex-1 font-semibold text-slate-700">Activity</h3>
        <button type="button" className="btn-subtle text-xs" onClick={() => setShowDetails((s) => !s)}>
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <Avatar user={user} size="md" />
        <div className="flex-1">
          <AutoTextarea
            multiline
            value={text}
            maxLength={5000}
            onFocus={() => setFocused(true)}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            aria-label="Write a comment"
            className="input"
          />
          {(focused || text) && (
            <button type="button" className="btn-primary mt-2" disabled={!text.trim() || add.isPending} onClick={() => add.mutate(text.trim())}>
              Save
            </button>
          )}
        </div>
      </div>

      <ul className="space-y-4">
        {card.comments.map((c) => (
          <Comment key={c.id} comment={c} isMine={c.userId === user.id} cardId={card.id} boardId={boardId} />
        ))}
      </ul>

      {showDetails && (
        <div className="mt-6">
          <ActivityFeed activities={card.activities} />
        </div>
      )}
    </section>
  );
}
