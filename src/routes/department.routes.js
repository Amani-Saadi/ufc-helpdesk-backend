import { Router } from 'express';
import { consulterDepartements } from '../controllers/department.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, consulterDepartements);

export default router;
