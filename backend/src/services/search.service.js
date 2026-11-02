import { boardsRepo, cardsRepo, listsRepo } from '../repositories/index.js';

const MAX_RESULTS = 20;

export function search(userId, query) {
  const q = query.toLowerCase();
  const boards = boardsRepo.find((b) => b.memberIds.includes(userId));
  const boardById = Object.fromEntries(boards.map((b) => [b.id, b]));

  const matchedBoards = boards
    .filter((b) => b.title.toLowerCase().includes(q))
    .slice(0, MAX_RESULTS)
    .map((b) => ({ id: b.id, title: b.title, background: b.background }));

  const matchedCards = cardsRepo
    .find(
      (c) =>
        boardById[c.boardId] &&
        !c.archived &&
        (c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
    )
    .slice(0, MAX_RESULTS)
    .map((c) => ({
      id: c.id,
      title: c.title,
      boardId: c.boardId,
      boardTitle: boardById[c.boardId].title,
      listTitle: listsRepo.findById(c.listId)?.title ?? null,
    }));

  return { boards: matchedBoards, cards: matchedCards };
}
