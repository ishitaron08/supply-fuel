import { Router } from 'express';
import { getPriceForCity, getAllPrices, updatePrice, createPrice } from '../controllers/pricingController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updatePriceSchema } from '../validators';
import { UserRole } from 'shared';

const router = Router();

router.use(authenticate);

router.get('/', getPriceForCity);
router.get('/all', authorize(UserRole.ADMIN), getAllPrices);
router.post('/', authorize(UserRole.ADMIN), createPrice);
router.put('/:id', authorize(UserRole.ADMIN), validate(updatePriceSchema), updatePrice);

export default router;
