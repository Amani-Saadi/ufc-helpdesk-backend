import { Router } from 'express';
import { consulterCentres } from '../controllers/center.controller.js';
import { authenticate } from '../middleware/auth.middleware.js'; // Ensure correct folder singular/plural if needed

const router = Router();

// ✅ Use 'authenticate' instead of 'verifierToken'
router.get('/', authenticate, consulterCentres);

export default router;