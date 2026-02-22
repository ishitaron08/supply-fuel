import { Router } from 'express';
import { uploadBill, getBills } from '../controllers/supplierBillController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadBill as uploadMiddleware } from '../utils/upload';
import { UserRole } from 'shared';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.post('/', uploadMiddleware.single('billFile'), uploadBill);
router.get('/', getBills);

export default router;
