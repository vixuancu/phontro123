import express from 'express';
const router = express.Router();

import { asyncHandler, authUser, authAdmin } from '../auth/checkAuth';
import controllerPosts from '../controllers/posts.controller';

router.post('/api/create-post', authUser, asyncHandler(controllerPosts.createPost));
router.get('/api/get-posts', asyncHandler(controllerPosts.getPosts));
router.get('/api/get-post-by-id', asyncHandler(controllerPosts.getPostById));
router.get('/api/get-post-by-user-id', authUser, asyncHandler(controllerPosts.getPostByUserId));
router.get('/api/get-new-post', asyncHandler(controllerPosts.getNewPost));
router.get('/api/get-post-vip', asyncHandler(controllerPosts.getPostVip));
router.post('/api/delete-post', authUser, asyncHandler(controllerPosts.deletePost));

router.get('/api/get-all-posts', authAdmin, asyncHandler(controllerPosts.getAllPosts));
router.post('/api/approve-post', authAdmin, asyncHandler(controllerPosts.approvePost));
router.post('/api/reject-post', authAdmin, asyncHandler(controllerPosts.rejectPost));

router.get('/api/post-suggest', authUser, asyncHandler(controllerPosts.postSuggest));

export default router;