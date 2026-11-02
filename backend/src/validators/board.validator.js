import { z } from 'zod';
import { BOARD_BACKGROUNDS, LABEL_COLORS } from '../config/constants.js';
import { id, idParam, index, title } from './common.js';

const background = z.enum(BOARD_BACKGROUNDS);
const labelColor = z.enum(LABEL_COLORS);

export const createWorkspaceSchema = {
  body: z.object({ name: title(80) }),
};

export const boardIdSchema = { params: idParam('boardId') };

export const createBoardSchema = {
  body: z.object({
    title: title(100),
    background: background.default('ocean'),
    workspaceId: id,
  }),
};

export const updateBoardSchema = {
  params: idParam('boardId'),
  body: z
    .object({ title: title(100), background })
    .partial()
    .refine((b) => Object.keys(b).length > 0, 'Nothing to update'),
};

export const addMemberSchema = {
  params: idParam('boardId'),
  body: z.object({ userId: id }),
};

export const removeMemberSchema = { params: idParam('boardId', 'userId') };

export const createLabelSchema = {
  params: idParam('boardId'),
  body: z.object({ name: z.string().trim().max(50).default(''), color: labelColor }),
};

export const updateLabelSchema = {
  params: idParam('boardId', 'labelId'),
  body: z
    .object({ name: z.string().trim().max(50), color: labelColor })
    .partial()
    .refine((b) => Object.keys(b).length > 0, 'Nothing to update'),
};

export const labelIdSchema = { params: idParam('boardId', 'labelId') };

export const createListSchema = {
  params: idParam('boardId'),
  body: z.object({ title: title(100) }),
};

export const updateListSchema = {
  params: idParam('listId'),
  body: z
    .object({ title: title(100), archived: z.boolean() })
    .partial()
    .refine((b) => Object.keys(b).length > 0, 'Nothing to update'),
};

export const moveListSchema = {
  params: idParam('listId'),
  body: z.object({ index }),
};

export const listIdSchema = { params: idParam('listId') };
