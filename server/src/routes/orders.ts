import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  approveOrder,
  rejectOrder,
  assignOrder,
  updateOrderStatus,
  getOrderStats,
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, assignOrderSchema, rejectOrderSchema } from '../validators';
import { UserRole } from 'shared';

const router = Router();

router.use(authenticate);

// Customer
router.post('/', authorize(UserRole.CUSTOMER), validate(createOrderSchema), createOrder);

// Shared
router.get('/', getOrders);
router.get('/stats', authorize(UserRole.ADMIN), getOrderStats);
router.get('/:id', getOrderById);

// Admin actions
router.put('/:id/approve', authorize(UserRole.ADMIN), approveOrder);
router.put('/:id/reject', authorize(UserRole.ADMIN), validate(rejectOrderSchema), rejectOrder);
router.put('/:id/assign', authorize(UserRole.ADMIN), validate(assignOrderSchema), assignOrder);

// Delivery partner / Admin
router.put('/:id/status', authorize(UserRole.DELIVERY_PARTNER, UserRole.ADMIN), updateOrderStatus);

export default router;
