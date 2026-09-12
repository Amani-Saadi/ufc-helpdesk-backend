import { Router } from 'express';
import { 
  creerUtilisateur, 
  desactiverUtilisateur, 
  affecterTicket, 
  ajouterDepartement, 
  ajouterCategorie,
  consulterStatistiques
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { 
  validate, 
  userCreateSchema, 
  ticketAssignSchema, 
  departmentSchema, 
  categorySchema 
} from '../validations/schemas.js';

const router = Router();

router.use(authenticate, authorize('ADMINISTRATEUR'));

router.get('/stats', consulterStatistiques);
router.post('/users', validate(userCreateSchema), creerUtilisateur);
router.patch('/users/:id/deactivate', desactiverUtilisateur);
router.patch('/tickets/:ticketId/assign', validate(ticketAssignSchema), affecterTicket);
router.post('/departments', validate(departmentSchema), ajouterDepartement);
router.post('/categories', validate(categorySchema), ajouterCategorie);

export default router;
