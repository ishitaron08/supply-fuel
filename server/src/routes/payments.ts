import { Router } from 'express';
import { createRazorpayOrder, verifyPayment } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPayment);

export default router;
