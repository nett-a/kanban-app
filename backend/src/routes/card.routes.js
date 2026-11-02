import { Router } from 'express';
import * as cardController from '../controllers/card.controller.js';
import { uploadSingleFile } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as v from '../validators/card.validator.js';

const router = Router();

router.get('/:cardId', validate(v.cardIdSchema), cardController.getCard);
router.patch('/:cardId', validate(v.updateCardSchema), cardController.updateCard);
router.patch('/:cardId/move', validate(v.moveCardSchema), cardController.moveCard);
router.delete('/:cardId', validate(v.cardIdSchema), cardController.deleteCard);

router.post('/:cardId/checklists', validate(v.createChecklistSchema), cardController.addChecklist);
router.patch('/:cardId/checklists/:checklistId', validate(v.updateChecklistSchema), cardController.updateChecklist);
router.delete('/:cardId/checklists/:checklistId', validate(v.checklistIdSchema), cardController.deleteChecklist);
router.post(
  '/:cardId/checklists/:checklistId/items',
  validate(v.createChecklistItemSchema),
  cardController.addChecklistItem,
);
router.patch(
  '/:cardId/checklists/:checklistId/items/:itemId',
  validate(v.updateChecklistItemSchema),
  cardController.updateChecklistItem,
);
router.delete(
  '/:cardId/checklists/:checklistId/items/:itemId',
  validate(v.checklistItemIdSchema),
  cardController.deleteChecklistItem,
);

router.post('/:cardId/comments', validate(v.createCommentSchema), cardController.addComment);

router.post('/:cardId/attachments', validate(v.cardIdSchema), uploadSingleFile, cardController.addAttachment);
router.get('/:cardId/attachments/:attachmentId', validate(v.attachmentIdSchema), cardController.downloadAttachment);
router.delete('/:cardId/attachments/:attachmentId', validate(v.attachmentIdSchema), cardController.deleteAttachment);

export default router;
