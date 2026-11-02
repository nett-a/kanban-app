import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardApi, cardApi, userApi, workspaceApi } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';

export const qk = {
  boards: ['boards'],
  workspaces: ['workspaces'],
  board: (id) => ['board', id],
  card: (id) => ['card', id],
  archived: (id) => ['archived', id],
  activities: (id) => ['activities', id],
  users: (q) => ['users', q],
};

export const useBoards = () => useQuery({ queryKey: qk.boards, queryFn: () => boardApi.list().then((r) => r.boards) });

export const useWorkspaces = () =>
  useQuery({ queryKey: qk.workspaces, queryFn: () => workspaceApi.list().then((r) => r.workspaces) });

export const useBoard = (boardId) =>
  useQuery({ queryKey: qk.board(boardId), queryFn: () => boardApi.get(boardId), enabled: Boolean(boardId) });

export const useCard = (cardId) =>
  useQuery({ queryKey: qk.card(cardId), queryFn: () => cardApi.get(cardId).then((r) => r.card), enabled: Boolean(cardId) });

export const useUsers = (q) => useQuery({ queryKey: qk.users(q), queryFn: () => userApi.list(q).then((r) => r.users) });

/**
 * Generic mutation for board-scoped changes: shows a toast on error and
 * refreshes the board (and the open card, if any) afterwards.
 * `optimistic(card, variables)` applies the change to the cached card
 * immediately and is rolled back if the request fails.
 */
export function useBoardMutation(boardId, mutationFn, { cardId, onSuccess, extraKeys = [], optimistic } = {}) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn,
    onSuccess,
    onMutate:
      optimistic && cardId
        ? async (variables) => {
            await queryClient.cancelQueries({ queryKey: qk.card(cardId) });
            const previous = queryClient.getQueryData(qk.card(cardId));
            queryClient.setQueryData(qk.card(cardId), (card) => card && optimistic(card, variables));
            return { previous };
          }
        : undefined,
    onError: (err, _variables, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(qk.card(cardId), ctx.previous);
      notify(err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.board(boardId) });
      if (cardId) queryClient.invalidateQueries({ queryKey: qk.card(cardId) });
      extraKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
  });
}

export function useToggleStar() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (boardId) => boardApi.toggleStar(boardId),
    onMutate: async (boardId) => {
      // Optimistic: flip the star everywhere it's cached.
      queryClient.setQueryData(qk.boards, (boards) =>
        boards?.map((b) => (b.id === boardId ? { ...b, starred: !b.starred } : b)),
      );
      queryClient.setQueryData(qk.board(boardId), (data) =>
        data ? { ...data, board: { ...data.board, starred: !data.board.starred } } : data,
      );
    },
    onError: (err) => notify(err.message),
    onSettled: (_d, _e, boardId) => {
      queryClient.invalidateQueries({ queryKey: qk.boards });
      queryClient.invalidateQueries({ queryKey: qk.board(boardId) });
    },
  });
}
