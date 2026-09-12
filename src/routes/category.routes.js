import { Router } from 'express';
import { consulterCategories } from '../controllers/category.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, consulterCategories);

export default router;
