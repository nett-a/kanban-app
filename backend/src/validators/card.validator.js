import { z } from 'zod';
import { LABEL_COLORS } from '../config/constants.js';
import { id, idParam, index, title } from './common.js';

const isoDate = z.iso.datetime({ offset: true, message: 'Invalid date' });

export const createCardSchema = {
  params: idParam('listId'),
  body: z.object({ title: title(500) }),
};

export const cardIdSchema = { params: idParam('cardId') };

export const updateCardSchema = {
  params: idParam('cardId'),
  body: z
    .object({
      title: title(500),
      description: z.string().max(10_000),
      labelIds: z.array(id).max(20),
      memberIds: z.array(id).max(50),
      startDate: isoDate.nullable(),
      dueDate: isoDate.nullable(),
      dueComplete: z.boolean(),
      cover: z.enum(LABEL_COLORS).nullable(),
      archived: z.boolean(),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, 'Nothing to update'),
};

export const moveCardSchema = {
  params: idParam('cardId'),
  body: z.object({ listId: id, index }),
};

export const createChecklistSchema = {
  params: idParam('cardId'),
  body: z.object({ title: title(200).default('Checklist') }),
};

export const updateChecklistSchema = {
  params: idParam('cardId', 'checklistId'),
  body: z.object({ title: title(200) }),
};

export const checklistIdSchema = { params: idParam('cardId', 'checklistId') };

export const createChecklistItemSchema = {
  params: idParam('cardId', 'checklistId'),
  body: z.object({ text: title(500) }),
};

export const updateChecklistItemSchema = {
  params: idParam('cardId', 'checklistId', 'itemId'),
  body: z
    .object({ text: title(500), done: z.boolean() })
    .partial()
    .refine((b) => Object.keys(b).length > 0, 'Nothing to update'),
};

export const checklistItemIdSchema = { params: idParam('cardId', 'checklistId', 'itemId') };

export const createCommentSchema = {
  params: idParam('cardId'),
  body: z.object({ text: title(5000) }),
};

export const updateCommentSchema = {
  params: idParam('commentId'),
  body: z.object({ text: title(5000) }),
};

export const commentIdSchema = { params: idParam('commentId') };

export const attachmentIdSchema = { params: idParam('cardId', 'attachmentId') };

export const searchSchema = {
  query: z.object({ q: z.string().trim().min(1).max(100) }),
};

export const userSearchSchema = {
  query: z.object({ q: z.string().trim().max(100).optional() }),
};
