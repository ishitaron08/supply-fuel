import { Router } from 'express';
import { createSite, getSites, getSiteById, updateSite, deleteSite } from '../controllers/siteController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSiteSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.post('/', validate(createSiteSchema), createSite);
router.get('/', getSites);
router.get('/:id', getSiteById);
router.put('/:id', updateSite);
router.delete('/:id', deleteSite);

export default router;
