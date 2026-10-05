import { Router } from 'express';
import { 
  consulterTechniciens, 
  consulterEmployes, 
  ajouterCentreTechnicien, 
  supprimerCentreTechnicien 
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/users/techniciens
router.get('/techniciens', authenticate, consulterTechniciens);

// GET /api/users/employes
router.get('/employes', authenticate, authorize('ADMINISTRATEUR', 'TECHNICIEN_IT'), consulterEmployes);

// POST /api/users/:id/centres
router.post('/:id/centres', authenticate, authorize('ADMINISTRATEUR'), ajouterCentreTechnicien);

// DELETE /api/users/:id/centres/:centreId
router.delete('/:id/centres/:centreId', authenticate, authorize('ADMINISTRATEUR'), supprimerCentreTechnicien);

export default router;