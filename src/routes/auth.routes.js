import { Router } from 'express';
import { seConnecter } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', seConnecter);

export default router;
