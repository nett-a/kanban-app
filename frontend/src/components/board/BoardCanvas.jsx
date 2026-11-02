import { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cardApi, listApi } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { qk } from '../../hooks/queries.js';
import { countActiveFilters, matchesFilters } from '../../utils/filters.js';
import { AddList } from './AddList.jsx';
import { ListColumn } from './ListColumn.jsx';

const byPosition = (a, b) => a.position - b.position;

/** Pure helpers applying a move to the cached board payload (optimistic UI). */
function applyListMove(data, listId, toIndex) {
  const lists = data.lists.filter((l) => l.id !== listId);
  lists.splice(toIndex, 0, data.lists.find((l) => l.id === listId));
  return { ...data, lists: lists.map((l, i) => ({ ...l, position: i })) };
}

function applyCardMove(data, cardId, toListId, toIndex) {
  const cards = data.cards.map((c) => ({ ...c }));
  const card = cards.find((c) => c.id === cardId);
  cards
    .filter((c) => c.listId === card.listId && c.id !== cardId)
    .sort(byPosition)
    .forEach((c, i) => {
      c.position = i;
    });
  const target = cards.filter((c) => c.listId === toListId && c.id !== cardId).sort(byPosition);
  card.listId = toListId;
  target.splice(toIndex, 0, card);
  target.forEach((c, i) => {
    c.position = i;
  });
  return { ...data, cards };
}

export function BoardCanvas({ data, filters, onOpenCard }) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const boardKey = qk.board(data.board.id);
  const filtered = countActiveFilters(filters) > 0;
  const [draggingCard, setDraggingCard] = useState(false);

  const cardsByList = useMemo(() => {
    const map = Object.fromEntries(data.lists.map((l) => [l.id, []]));
    for (const card of [...data.cards].sort(byPosition)) map[card.listId]?.push(card);
    return map;
  }, [data]);

  const visibleByList = useMemo(() => {
    if (!filtered) return cardsByList;
    return Object.fromEntries(
      Object.entries(cardsByList).map(([listId, cards]) => [listId, cards.filter((c) => matchesFilters(c, filters))]),
    );
  }, [cardsByList, filters, filtered]);

  const move = useMutation({
    mutationFn: (action) =>
      action.type === 'LIST' ? listApi.move(action.id, action.index) : cardApi.move(action.id, action.listId, action.index),
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: boardKey });
      const previous = queryClient.getQueryData(boardKey);
      queryClient.setQueryData(boardKey, (d) =>
        action.type === 'LIST' ? applyListMove(d, action.id, action.index) : applyCardMove(d, action.id, action.listId, action.index),
      );
      return { previous };
    },
    onError: (err, _action, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(boardKey, ctx.previous);
      notify(err.message);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: boardKey }),
  });

  // Runs before the library measures droppables: empty lists get a card-sized drop
  // zone so they can be targeted (the keyboard sensor needs the card to fit).
  const onBeforeCapture = ({ draggableId }) => {
    if (data.lists.some((l) => l.id === draggableId)) return;
    flushSync(() => setDraggingCard(true));
  };

  const onDragEnd = ({ source, destination, draggableId, type }) => {
    setDraggingCard(false);
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'LIST') {
      move.mutate({ type: 'LIST', id: draggableId, index: destination.index });
      return;
    }

    // With filters active the drop index refers to *visible* cards; translate it to the real list index.
    const toListId = destination.droppableId;
    let index = destination.index;
    if (filtered) {
      const all = cardsByList[toListId].filter((c) => c.id !== draggableId);
      const visible = visibleByList[toListId].filter((c) => c.id !== draggableId);
      if (index < visible.length) index = all.indexOf(visible[index]);
      else index = visible.length ? all.indexOf(visible[visible.length - 1]) + 1 : all.length;
    }
    move.mutate({ type: 'CARD', id: draggableId, listId: toListId, index });
  };

  return (
    <DragDropContext onBeforeCapture={onBeforeCapture} onDragEnd={onDragEnd}>
      <div className="board-scroll min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
        <Droppable droppableId="board" type="LIST" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex h-full items-start gap-3 px-3 pt-1 pb-4 sm:px-4"
              data-testid="board-canvas"
            >
              {data.lists.map((list, index) => (
                <Draggable key={list.id} draggableId={list.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <ListColumn
                      list={list}
                      cards={visibleByList[list.id] ?? []}
                      totalCards={cardsByList[list.id]?.length ?? 0}
                      board={data.board}
                      filtered={filtered}
                      expandDropZone={draggingCard}
                      onOpenCard={onOpenCard}
                      dragProvided={dragProvided}
                      isDragging={snapshot.isDragging}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <AddList boardId={data.board.id} />
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
}
