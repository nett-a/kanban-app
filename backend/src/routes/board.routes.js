import { Router } from 'express';
import * as boardController from '../controllers/board.controller.js';
import * as listController from '../controllers/list.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as v from '../validators/board.validator.js';

const router = Router();

router.get('/', boardController.listBoards);
router.post('/', validate(v.createBoardSchema), boardController.createBoard);
router.get('/:boardId', validate(v.boardIdSchema), boardController.getBoard);
router.patch('/:boardId', validate(v.updateBoardSchema), boardController.updateBoard);
router.delete('/:boardId', validate(v.boardIdSchema), boardController.deleteBoard);

router.post('/:boardId/star', validate(v.boardIdSchema), boardController.toggleStar);
router.get('/:boardId/archived', validate(v.boardIdSchema), boardController.getArchived);
router.get('/:boardId/activities', validate(v.boardIdSchema), boardController.getActivities);

router.post('/:boardId/members', validate(v.addMemberSchema), boardController.addMember);
router.delete('/:boardId/members/:userId', validate(v.removeMemberSchema), boardController.removeMember);

router.post('/:boardId/labels', validate(v.createLabelSchema), boardController.createLabel);
router.patch('/:boardId/labels/:labelId', validate(v.updateLabelSchema), boardController.updateLabel);
router.delete('/:boardId/labels/:labelId', validate(v.labelIdSchema), boardController.deleteLabel);

router.post('/:boardId/lists', validate(v.createListSchema), listController.createList);

export default router;
