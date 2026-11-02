import { formatDateTime, timeAgo } from '../../utils/date.js';
import { Avatar } from '../ui/Avatar.jsx';

export function ActivityFeed({ activities }) {
  if (!activities.length) return <p className="text-sm text-slate-500">No activity yet.</p>;
  return (
    <ul className="space-y-3" data-testid="activity-feed">
      {activities.map((a) => (
        <li key={a.id} className="flex gap-2 text-sm">
          <Avatar user={a.user} size="sm" />
          <div className="min-w-0">
            <p className="text-slate-700">
              <span className="font-semibold">{a.user?.name ?? 'Someone'}</span> {a.message}
            </p>
            <p className="text-xs text-slate-500" title={formatDateTime(a.createdAt)}>
              {timeAgo(a.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
