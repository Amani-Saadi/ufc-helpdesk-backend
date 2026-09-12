import { Router } from 'express';
import {
  creerTicket,
  consulterTickets,
  marquerCommeVu,
  changerStatut,
  changerPriorite,
  assignerTicket,
  confirmerResolution
} from '../controllers/ticket.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, creerTicket);
router.get('/', authenticate, consulterTickets);
router.patch('/:id/vu', authenticate, marquerCommeVu);
router.patch('/:id/statut', authenticate, authorize('TECHNICIEN_IT', 'ADMINISTRATEUR'), changerStatut);
router.patch('/:id/priorite', authenticate, authorize('TECHNICIEN_IT', 'ADMINISTRATEUR'), changerPriorite);
router.patch('/:id/assigner', authenticate, authorize('TECHNICIEN_IT', 'ADMINISTRATEUR'), assignerTicket);
router.patch('/:id/confirmer-resolution', authenticate, confirmerResolution);

export default router;