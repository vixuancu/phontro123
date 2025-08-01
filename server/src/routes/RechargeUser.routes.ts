import express from 'express';
const router = express.Router();

import { asyncHandler, authUser, authAdmin } from '../auth/checkAuth';
import controllerUser from '../controllers/users.controller';

router.get('/api/recharge-user', authUser, asyncHandler(controllerUser.getRechargeUser));

export default router;