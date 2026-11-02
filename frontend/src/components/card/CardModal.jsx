import { useState } from 'react';
import clsx from 'clsx';
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Clock,
  CreditCard,
  Image,
  Paperclip,
  Plus,
  SquareCheck,
  Tag,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { cardApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { qk, useBoardMutation, useCard } from '../../hooks/queries.js';
import { DUE_STATUS_CLASS, dueStatus, formatDateTime } from '../../utils/date.js';
import { labelClass } from '../../utils/theme.js';
import { Avatar } from '../ui/Avatar.jsx';
import { InlineEdit } from '../ui/InlineEdit.jsx';
import { Modal } from '../ui/Modal.jsx';
import { usePopover } from '../../hooks/usePopover.js';
import { Spinner } from '../ui/Spinner.jsx';
import { CardAttachments } from './CardAttachments.jsx';
import { CardChecklist } from './CardChecklist.jsx';
import { CardComments } from './CardComments.jsx';
import { CardDescription } from './CardDescription.jsx';
import {
  AttachmentPopover,
  ChecklistPopover,
  CoverPopover,
  DatesPopover,
  LabelsPopover,
  MembersPopover,
  MovePopover,
} from './CardPopovers.jsx';

const DUE_LABEL = { complete: 'Complete', overdue: 'Overdue', soon: 'Due soon' };

function SidebarButton({ icon: Icon, label, popover, onClick, danger }) {
  return (
    <button
      {...popover?.triggerProps}
      type="button"
      onClick={onClick ?? popover?.toggle}
      className={clsx(
        'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm font-medium',
        danger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300/80',
      )}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function CardModalBody({ card, boardData, onClose }) {
  const { board, lists, cards } = boardData;
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const archivedKey = { extraKeys: [qk.archived(board.id)] };

  const update = useBoardMutation(board.id, (patch) => cardApi.update(card.id, patch), {
    cardId: card.id,
    optimistic: (cached, patch) => ({ ...cached, ...patch }),
    ...archivedKey,
  });
  const move = useBoardMutation(board.id, ({ listId, index }) => cardApi.move(card.id, listId, index), { cardId: card.id });
  const remove = useBoardMutation(board.id, () => cardApi.remove(card.id), { onSuccess: onClose, ...archivedKey });

  const members = usePopover();
  const labels = usePopover();
  const checklist = usePopover();
  const dates = usePopover();
  const attachment = usePopover();
  const cover = usePopover();
  const movePop = usePopover();
  const membersInline = usePopover();
  const labelsInline = usePopover();

  const cardLabels = card.labelIds.map((id) => board.labels.find((l) => l.id === id)).filter(Boolean);
  const isMember = card.memberIds.includes(user.id);
  const status = dueStatus(card.dueDate, card.dueComplete);
  const cardsInList = (listId) => cards.filter((c) => c.listId === listId).sort((a, b) => a.position - b.position);

  return (
    <>
      {card.cover && (
        <div className={`relative h-24 rounded-t-xl ${labelClass(card.cover)}`}>
          <button
            {...cover.triggerProps}
            type="button"
            onClick={cover.toggle}
            className="absolute right-14 bottom-2 inline-flex items-center gap-1 rounded-md bg-black/20 px-2 py-1 text-xs font-medium text-white hover:bg-black/30"
          >
            <Image size={14} /> Cover
          </button>
        </div>
      )}

      <button type="button" onClick={onClose} aria-label="Close card" className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-slate-600 hover:bg-slate-200">
        <X size={20} />
      </button>

      {card.archived && (
        <div className="flex items-center gap-2 bg-amber-100 px-6 py-3 text-sm text-amber-900" role="status">
          <Archive size={16} /> This card is archived.
        </div>
      )}

      <div className="px-4 pt-5 pb-6 sm:px-6">
        <div className="mb-6 flex gap-3 pr-10">
          <CreditCard size={22} className="mt-1 shrink-0 text-slate-600" />
          <div className="min-w-0 flex-1">
            <InlineEdit
              value={card.title}
              onSave={(title) => update.mutate({ title })}
              ariaLabel="card title"
              maxLength={500}
              className="w-full rounded px-1 text-xl font-semibold break-words text-slate-800 hover:bg-slate-200/60"
              inputClassName="w-full text-xl font-semibold"
            />
            <p className="px-1 text-sm text-slate-500">
              in list <span className="font-medium text-slate-700 underline">{card.listTitle}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* ---------- Main column ---------- */}
          <div className="min-w-0 flex-1">
            <div className="mb-6 ml-8 flex flex-wrap gap-6">
              {card.members.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">Members</p>
                  <div className="flex items-center gap-1">
                    {card.members.map((m) => (
                      <Avatar key={m.id} user={m} size="md" />
                    ))}
                    <button
                      {...membersInline.triggerProps}
                      type="button"
                      onClick={membersInline.toggle}
                      aria-label="Add members"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}

              {cardLabels.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">Labels</p>
                  <div className="flex flex-wrap items-center gap-1" data-testid="card-modal-labels">
                    {cardLabels.map((l) => (
                      <span key={l.id} className={`h-8 min-w-12 rounded px-3 text-sm leading-8 font-medium text-white ${labelClass(l.color)}`}>
                        {l.name}
                      </span>
                    ))}
                    <button
                      {...labelsInline.triggerProps}
                      type="button"
                      onClick={labelsInline.toggle}
                      aria-label="Add labels"
                      className="flex h-8 w-8 items-center justify-center rounded bg-slate-200 hover:bg-slate-300"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}

              {card.dueDate && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">Due date</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-600"
                      checked={card.dueComplete}
                      onChange={() => update.mutate({ dueComplete: !card.dueComplete })}
                      aria-label="Mark due date complete"
                    />
                    <span className="rounded bg-slate-200/80 px-2 py-1 text-sm text-slate-700">
                      {formatDateTime(card.dueDate)}
                      {DUE_LABEL[status] && (
                        <span className={clsx('ml-2 rounded px-1.5 py-0.5 text-xs font-medium', DUE_STATUS_CLASS[status])} data-testid="due-status">
                          {DUE_LABEL[status]}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <CardDescription key={card.description} card={card} update={update} />
            <CardAttachments card={card} boardId={board.id} />
            {card.checklists.map((cl) => (
              <CardChecklist key={cl.id} checklist={cl} cardId={card.id} boardId={board.id} />
            ))}
            <CardComments card={card} boardId={board.id} />
          </div>

          {/* ---------- Sidebar ---------- */}
          <aside className="w-full shrink-0 space-y-6 md:w-44">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Add to card</p>
              {!isMember && (
                <SidebarButton icon={UserPlus} label="Join" onClick={() => update.mutate({ memberIds: [...card.memberIds, user.id] })} />
              )}
              <SidebarButton icon={User} label="Members" popover={members} />
              <SidebarButton icon={Tag} label="Labels" popover={labels} />
              <SidebarButton icon={SquareCheck} label="Checklist" popover={checklist} />
              <SidebarButton icon={Clock} label="Dates" popover={dates} />
              <SidebarButton icon={Paperclip} label="Attachment" popover={attachment} />
              {!card.cover && <SidebarButton icon={Image} label="Cover" popover={cover} />}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Actions</p>
              <SidebarButton icon={ArrowRight} label="Move" popover={movePop} />
              {card.archived ? (
                <>
                  <SidebarButton icon={ArchiveRestore} label="Send to board" onClick={() => update.mutate({ archived: false })} />
                  {confirmDelete ? (
                    <div className="space-y-2 rounded-md bg-red-50 p-2 text-xs text-red-800">
                      <p>Delete this card permanently? There is no undo.</p>
                      <SidebarButton icon={Trash2} label="Confirm delete" danger onClick={() => remove.mutate()} />
                    </div>
                  ) : (
                    <SidebarButton icon={Trash2} label="Delete" danger onClick={() => setConfirmDelete(true)} />
                  )}
                </>
              ) : (
                <SidebarButton icon={Archive} label="Archive" onClick={() => update.mutate({ archived: true })} />
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users size={14} /> {board.members.length} board members
            </div>
          </aside>
        </div>
      </div>

      <MembersPopover popover={members} card={card} board={board} update={update} />
      <MembersPopover popover={membersInline} card={card} board={board} update={update} />
      <LabelsPopover popover={labels} card={card} board={board} update={update} />
      <LabelsPopover popover={labelsInline} card={card} board={board} update={update} />
      <ChecklistPopover popover={checklist} card={card} boardId={board.id} />
      {dates.open && <DatesPopover popover={dates} card={card} update={update} />}
      <AttachmentPopover popover={attachment} card={card} boardId={board.id} />
      <CoverPopover popover={cover} card={card} update={update} />
      {movePop.open && <MovePopover popover={movePop} card={card} lists={lists} cardsInList={cardsInList} move={move} />}
    </>
  );
}

export function CardModal({ cardId, boardData, onClose }) {
  const { data: card, isLoading, error } = useCard(cardId);

  return (
    <Modal open onClose={onClose} label={card ? `Card ${card.title}` : 'Card'}>
      {isLoading && (
        <div className="flex h-60 items-center justify-center">
          <Spinner />
        </div>
      )}
      {error && (
        <div className="space-y-4 p-8 text-center">
          <p className="text-slate-600">This card could not be found. It may have been deleted.</p>
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      )}
      {card && <CardModalBody card={card} boardData={boardData} onClose={onClose} />}
    </Modal>
  );
}
