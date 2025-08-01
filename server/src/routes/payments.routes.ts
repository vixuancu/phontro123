import express from 'express';
const router = express.Router();

import { asyncHandler, authUser, authAdmin } from '../auth/checkAuth';
import controllerPayments from '../controllers/payments.controller';

router.post('/api/payments', authUser, asyncHandler(controllerPayments.payments));
router.get('/api/check-payment-vnpay', asyncHandler(controllerPayments.checkPaymentVnpay));
router.get('/api/check-payment-momo', asyncHandler(controllerPayments.checkPaymentMomo));

export default router;