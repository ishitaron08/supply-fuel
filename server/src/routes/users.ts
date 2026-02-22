import { Router } from 'express';
import { getProfile, updateProfile, listCustomers, listDeliveryPartners, createDeliveryPartner } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from 'shared';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Admin routes
router.get('/customers', authorize(UserRole.ADMIN), listCustomers);
router.get('/delivery-partners', authorize(UserRole.ADMIN), listDeliveryPartners);
router.post('/delivery-partners', authorize(UserRole.ADMIN), createDeliveryPartner);

export default router;
