import { Router } from 'express';
import * as cardController from '../controllers/card.controller.js';
import * as userController from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createWorkspaceSchema } from '../validators/board.validator.js';
import { commentIdSchema, searchSchema, updateCommentSchema, userSearchSchema } from '../validators/card.validator.js';
import authRoutes from './auth.routes.js';
import boardRoutes from './board.routes.js';
import cardRoutes from './card.routes.js';
import listRoutes from './list.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
router.use('/auth', authRoutes);

// Everything below requires an authenticated session.
router.use(requireAuth);
router.get('/users', validate(userSearchSchema), userController.listUsers);
router.get('/workspaces', userController.listWorkspaces);
router.post('/workspaces', validate(createWorkspaceSchema), userController.createWorkspace);
router.get('/search', validate(searchSchema), userController.search);
router.use('/boards', boardRoutes);
router.use('/lists', listRoutes);
router.use('/cards', cardRoutes);
router.patch('/comments/:commentId', validate(updateCommentSchema), cardController.updateComment);
router.delete('/comments/:commentId', validate(commentIdSchema), cardController.deleteComment);

export default router;
