import express from 'express';
const router = express.Router();

import { asyncHandler, authUser, authAdmin } from '../auth/checkAuth';
import controllerUsers from '../controllers/users.controller';

router.post('/api/register', asyncHandler(controllerUsers.register));
router.post('/api/login', asyncHandler(controllerUsers.login));
router.post('/api/login-google', asyncHandler(controllerUsers.loginGoogle));
router.get('/api/auth', authUser, asyncHandler(controllerUsers.authUser));
router.get('/api/logout', authUser, asyncHandler(controllerUsers.logout));
router.get('/api/refresh-token', asyncHandler(controllerUsers.refreshToken));
router.get('/api/recharge-user', authUser, asyncHandler(controllerUsers.getRechargeUser));
router.post('/api/update-user', authUser, asyncHandler(controllerUsers.updateUser));
router.post('/api/change-password', authUser, asyncHandler(controllerUsers.changePassword));
router.post('/api/forgot-password', asyncHandler(controllerUsers.forgotPassword));
router.post('/api/reset-password', asyncHandler(controllerUsers.resetPassword));

router.get('/api/get-users', authAdmin, asyncHandler(controllerUsers.getUsers));
router.get('/api/get-admin-stats', authAdmin, asyncHandler(controllerUsers.getAdminStats));
router.get('/api/get-recharge-stats', authAdmin, asyncHandler(controllerUsers.getRechargeStats));

router.get('/api/get-hot-search', asyncHandler(controllerUsers.getHotSearch));
router.get('/api/search', asyncHandler(controllerUsers.searchKeyword));

router.post('/api/add-search-keyword', asyncHandler(controllerUsers.addSearchKeyword));
router.get('/api/get-search-keyword', asyncHandler(controllerUsers.searchKeyword));

router.get('/admin', authAdmin, (req, res) => {
    return res.status(200).json({ message: true });
});

export default router;