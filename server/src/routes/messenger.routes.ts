import express from 'express';
const router = express.Router();

import { asyncHandler, authUser, authAdmin } from '../auth/checkAuth';
import controllerMessager from '../controllers/messager.controller';

router.post('/api/create-message', authUser, asyncHandler(controllerMessager.createMessage));
router.get('/api/get-messages', authUser, asyncHandler(controllerMessager.getMessages));
router.get('/api/get-messages-by-user-id', authUser, asyncHandler(controllerMessager.getMessagesByUserId));
router.post('/api/mark-message-read', authUser, asyncHandler(controllerMessager.markMessageAsRead));
router.post('/api/mark-all-messages-read', authUser, asyncHandler(controllerMessager.markAllMessagesAsRead));

export default router;