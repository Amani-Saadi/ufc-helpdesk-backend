import { Router } from 'express';
import { 
  creerUtilisateur, 
  listerUtilisateurs, 
  desactiverUtilisateur, 
  affecterTicket, 
  ajouterCentre, 
  listerCentres, // Added
  ajouterCategorie,
  consulterStatistiques
} from '../controllers/admin.controller.js';

import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { 
  validate, 
  userCreateSchema, 
  ticketAssignSchema, 
  centerSchema, 
  categorySchema 
} from '../validations/schemas.js';

const router = Router();

router.use(authenticate, authorize('ADMINISTRATEUR'));

router.get('/stats', consulterStatistiques);
router.get('/users', listerUtilisateurs);
router.post('/users', validate(userCreateSchema), creerUtilisateur);
router.patch('/users/:id/deactivate', desactiverUtilisateur);

router.patch('/tickets/:ticketId/assign', validate(ticketAssignSchema), affecterTicket);

router.get('/centers', listerCentres); // ADDED: Endpoint for frontend dropdowns
router.post('/centers', validate(centerSchema), ajouterCentre);
router.post('/categories', validate(categorySchema), ajouterCategorie);

export default router;