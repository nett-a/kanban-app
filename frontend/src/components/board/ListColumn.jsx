import { useState } from 'react';
import clsx from 'clsx';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Ellipsis } from 'lucide-react';
import { listApi } from '../../api/index.js';
import { useBoardMutation } from '../../hooks/queries.js';
import { InlineEdit } from '../ui/InlineEdit.jsx';
import { usePopover } from '../../hooks/usePopover.js';
import { AddCard } from './AddCard.jsx';
import { CardItem } from './CardItem.jsx';
import { ListMenu } from './ListMenu.jsx';

export function ListColumn({ list, cards, totalCards, board, filtered, expandDropZone, onOpenCard, dragProvided, isDragging }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const menu = usePopover();
  const rename = useBoardMutation(board.id, (title) => listApi.update(list.id, { title }));
  const { innerRef, draggableProps, dragHandleProps } = dragProvided;

  return (
    <section
      ref={innerRef}
      {...draggableProps}
      aria-label={`List ${list.title}`}
      data-testid="list"
      className={clsx(
        'flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-list shadow-sm',
        isDragging && 'rotate-2 shadow-xl ring-2 ring-brand-500/40',
      )}
    >
      <header {...dragHandleProps} className="flex items-start gap-1 px-2 pt-2 pb-1" aria-label={`Drag list ${list.title}`}>
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={list.title}
            onSave={(title) => rename.mutate(title)}
            ariaLabel="list title"
            maxLength={100}
            className="w-full rounded-md px-2 py-1 text-sm font-semibold text-slate-700"
            inputClassName="w-full text-sm font-semibold"
          />
          {filtered && (
            <p className="px-2 text-xs text-slate-500">
              {cards.length} of {totalCards} cards
            </p>
          )}
        </div>
        <button
          {...menu.triggerProps}
          type="button"
          onClick={menu.toggle}
          aria-label={`List actions for ${list.title}`}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-300/60"
        >
          <Ellipsis size={16} />
        </button>
        <ListMenu
          popover={menu}
          list={list}
          board={board}
          onAddCard={() => {
            menu.close();
            setComposerOpen(true);
          }}
        />
      </header>

      <Droppable droppableId={list.id} type="CARD">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={clsx(
              'list-scroll mx-1 flex min-h-2 flex-col gap-2 overflow-y-auto px-1 pb-1',
              expandDropZone && cards.length === 0 && 'min-h-14',
              snapshot.isDraggingOver && 'rounded-lg bg-slate-300/40',
            )}
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(cardProvided, cardSnapshot) => (
                  <CardItem
                    card={card}
                    board={board}
                    onOpen={() => onOpenCard(card.id)}
                    provided={cardProvided}
                    isDragging={cardSnapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <AddCard listId={list.id} boardId={board.id} open={composerOpen} onOpenChange={setComposerOpen} />
    </section>
  );
}
