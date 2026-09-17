import { Router } from 'express';
import { 
  creerUtilisateur, 
  listerUtilisateurs, 
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

// Toutes les routes de ce fichier nécessitent d'être authentifié en tant qu'ADMINISTRATEUR
router.use(authenticate, authorize('ADMINISTRATEUR'));

// Statistiques du système
router.get('/stats', consulterStatistiques);

// Gestion des utilisateurs
router.get('/users', listerUtilisateurs);
router.post('/users', validate(userCreateSchema), creerUtilisateur);
router.patch('/users/:id/deactivate', desactiverUtilisateur);

// Gestion des tickets
router.patch('/tickets/:ticketId/assign', validate(ticketAssignSchema), affecterTicket);

// Configuration (Départements et Catégories)
router.post('/departments', validate(departmentSchema), ajouterDepartement);
router.post('/categories', validate(categorySchema), ajouterCategorie);

export default router;