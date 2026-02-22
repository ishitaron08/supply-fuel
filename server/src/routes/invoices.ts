import { Router } from 'express';
import { getInvoiceByOrder, downloadInvoice, triggerInvoiceGeneration } from '../controllers/invoiceController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from 'shared';

const router = Router();

router.use(authenticate);

router.get('/:orderId', getInvoiceByOrder);
router.get('/:orderId/download', downloadInvoice);
router.post('/generate/:orderId', authorize(UserRole.ADMIN), triggerInvoiceGeneration);

export default router;
