import { Router } from 'express';
import { createVehicle, getVehicles, getVehicleById, updateVehicle, deleteVehicle } from '../controllers/vehicleController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createVehicleSchema } from '../validators';
import { UserRole } from 'shared';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.post('/', validate(createVehicleSchema), createVehicle);
router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
