import { Router } from 'express';
import * as cardController from '../controllers/card.controller.js';
import * as listController from '../controllers/list.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { listIdSchema, moveListSchema, updateListSchema } from '../validators/board.validator.js';
import { createCardSchema } from '../validators/card.validator.js';

const router = Router();

router.patch('/:listId', validate(updateListSchema), listController.updateList);
router.patch('/:listId/move', validate(moveListSchema), listController.moveList);
router.delete('/:listId', validate(listIdSchema), listController.deleteList);
router.post('/:listId/cards', validate(createCardSchema), cardController.createCard);

export default router;
