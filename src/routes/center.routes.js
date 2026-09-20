import { Router } from 'express';
import { consulterCentres } from '../controllers/center.controller.js';
import { verifierToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifierToken, consulterCentres);

export default router;