import clsx from 'clsx';
import { avatarClass } from '../../utils/theme.js';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export function Avatar({ user, size = 'md', className }) {
  if (!user) return null;
  return (
    <span
      title={`${user.name} (@${user.username})`}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white select-none',
        SIZES[size],
        avatarClass(user.avatarColor),
        className,
      )}
    >
      {user.initials}
    </span>
  );
}

export function AvatarStack({ users, max = 4, size = 'md' }) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={size} />
      ))}
      {rest > 0 && (
        <span
          className={clsx(
            'inline-flex items-center justify-center rounded-full bg-white/30 font-semibold text-white ring-2 ring-white/60',
            SIZES[size],
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
