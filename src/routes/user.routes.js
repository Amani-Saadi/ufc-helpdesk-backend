import { Router } from 'express';
import { consulterTechniciens, consulterEmployes } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/techniciens', authenticate, consulterTechniciens);
router.get('/employes', authenticate, authorize('ADMINISTRATEUR', 'TECHNICIEN_IT'), consulterEmployes);

export default router;
