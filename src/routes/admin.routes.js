import { Router } from 'express';
import { 
  listerUtilisateurs, 
  obtenirUtilisateurParId,
  modifierUtilisateur,
  creerUtilisateur, 
  desactiverUtilisateur, 
  listerCentres, 
  ajouterCentre, 
  desactiverCentre, 
  listerTechniciensAvecStats, 
  affecterTicket, 
  ajouterCategorie, 
  consulterStatistiques,
  obtenirTempsReponseParJour,
  gererCentresTechnicien,
  ajouterCentreTechnicien,
  supprimerCentreTechnicien,
  assignerCentreUtilisateur,
  changerMotDePasseAdmin,
  retirerCentreUtilisateur,
  supprimerUtilisateur,
  supprimerCentre,
  changerMotDePasseCentre,
  supprimerTicket
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all admin routes
router.use(authenticate, authorize('ADMINISTRATEUR'));

// User & Technician CRUD
router.get('/users', listerUtilisateurs);
router.post('/users', creerUtilisateur);
router.get('/users/:id', obtenirUtilisateurParId);
router.put('/users/:id', modifierUtilisateur);
router.patch('/users/:id', modifierUtilisateur);
router.patch('/users/:id/status', desactiverUtilisateur);
router.patch('/users/:id/deactivate', desactiverUtilisateur);
router.patch('/users/:id/toggle-active', desactiverUtilisateur);
router.delete('/users/:id', supprimerUtilisateur);

// Center Management
router.get('/centers', listerCentres);
router.post('/centers', ajouterCentre);
router.patch('/centers/:id/status', desactiverCentre);
router.patch('/centers/:id/deactivate', desactiverCentre);
router.patch('/centers/:id/password', changerMotDePasseCentre);
router.delete('/centers/:id', supprimerCentre);

// Technicians API
router.get('/technicians-stats', listerTechniciensAvecStats);
router.get('/technicians/:id', obtenirUtilisateurParId);
router.put('/technicians/:id', modifierUtilisateur);
router.patch('/technicians/:id', modifierUtilisateur);

// Technician Multi-Center Assignment (supporting 10+ centers per tech)
router.get('/technicians/:id/centers', gererCentresTechnicien);
router.put('/technicians/:id/centers', gererCentresTechnicien);
router.post('/technicians/:id/centers', ajouterCentreTechnicien);
router.post('/users/:id/centers', ajouterCentreTechnicien);
router.put('/users/:id/center', assignerCentreUtilisateur);
router.patch('/users/:id/center', assignerCentreUtilisateur);
router.delete('/users/:id/centers/:centreId', supprimerCentreTechnicien);
router.delete('/technicians/:id/centers/:centreId', supprimerCentreTechnicien);
router.patch('/users/:id/remove-center', retirerCentreUtilisateur);

// Other Actions
router.patch('/tickets/:id/assign', affecterTicket);
router.delete('/tickets/:id', supprimerTicket);
router.post('/categories', ajouterCategorie);
router.get('/stats', consulterStatistiques);
router.get('/stats/response-time-by-day', obtenirTempsReponseParJour);
router.patch('/users/:id/password', changerMotDePasseAdmin);

export default router;