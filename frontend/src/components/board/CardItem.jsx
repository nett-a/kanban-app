import clsx from 'clsx';
import { AlignLeft, Clock, MessageSquare, Paperclip, SquareCheck } from 'lucide-react';
import { DUE_STATUS_CLASS, dueStatus, formatShortDate } from '../../utils/date.js';
import { labelClass } from '../../utils/theme.js';
import { Avatar } from '../ui/Avatar.jsx';

export function CardItem({ card, board, onOpen, provided, isDragging }) {
  const labels = card.labelIds.map((id) => board.labels.find((l) => l.id === id)).filter(Boolean);
  const members = card.memberIds.map((id) => board.members.find((m) => m.id === id)).filter(Boolean);
  const { badges } = card;
  const status = dueStatus(card.dueDate, card.dueComplete);
  const checklistDone = badges.checkItems > 0 && badges.checkItems === badges.checkItemsDone;
  const { innerRef, draggableProps, dragHandleProps } = provided;

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
      }}
      data-testid="card"
      aria-label={`Card ${card.title}`}
      className={clsx(
        'group overflow-hidden rounded-lg bg-white text-left shadow-[0_1px_1px_rgba(9,30,66,0.25)] outline-none hover:ring-2 hover:ring-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500',
        isDragging && 'rotate-3 shadow-xl ring-2 ring-brand-500',
      )}
    >
      {card.cover && <div className={`h-8 ${labelClass(card.cover)}`} />}
      <div className="px-3 pt-2 pb-2">
        {labels.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {labels.map((l) => (
              <span
                key={l.id}
                title={l.name || l.color}
                className={`h-2 min-w-10 rounded-full ${labelClass(l.color)}`}
                data-testid="card-label"
              />
            ))}
          </div>
        )}

        <p className="text-sm break-words text-slate-800">{card.title}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 empty:hidden">
          {card.dueDate && (
            <span
              className={clsx('inline-flex items-center gap-1 rounded px-1.5 py-0.5', DUE_STATUS_CLASS[status])}
              title={card.dueComplete ? 'This card is complete' : 'Due date'}
            >
              <Clock size={13} /> {formatShortDate(card.dueDate)}
            </span>
          )}
          {card.description && (
            <span title="This card has a description">
              <AlignLeft size={14} />
            </span>
          )}
          {badges.comments > 0 && (
            <span className="inline-flex items-center gap-1" title="Comments">
              <MessageSquare size={13} /> {badges.comments}
            </span>
          )}
          {badges.attachments > 0 && (
            <span className="inline-flex items-center gap-1" title="Attachments">
              <Paperclip size={13} /> {badges.attachments}
            </span>
          )}
          {badges.checkItems > 0 && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5',
                checklistDone && 'bg-emerald-500 text-white',
              )}
              title="Checklist items"
            >
              <SquareCheck size={13} /> {badges.checkItemsDone}/{badges.checkItems}
            </span>
          )}
          {members.length > 0 && (
            <span className="ml-auto flex -space-x-1">
              {members.map((m) => (
                <Avatar key={m.id} user={m} size="sm" />
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
