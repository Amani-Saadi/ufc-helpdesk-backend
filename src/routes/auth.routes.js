
import { Router } from 'express';

import {
  seConnecter,
  modifierMotDePasse,
  obtenirProfil
} from '../controllers/auth.controller.js';

import {
  authenticate
} from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/auth/login
// User login
router.post('/login', seConnecter);

// PUT /api/auth/changer-mot-de-passe
// Change password for the authenticated user
router.get('/me', authenticate, obtenirProfil);

router.put(
  '/changer-mot-de-passe',
  authenticate,
  modifierMotDePasse
);

export default router;
