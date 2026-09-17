import { Router } from 'express';
import multer from 'multer';
import {
  creerTicket,
  consulterTickets,
  marquerCommeVu,
  changerStatut,
  changerPriorite,
  assignerTicket,
  confirmerResolution,
  telechargerFichier,
  ajouterCommentaire,
  consulterCommentaires
} from '../controllers/ticket.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// التصحيح هنا: مطابقة اسم الحقل مع ما يرسله الـ Frontend ('fichier')
router.post('/', authenticate, upload.single('fichier'), creerTicket);

router.get('/', authenticate, consulterTickets);
router.get('/fichiers/:fichierId/download', authenticate, telechargerFichier);

// Comment routes
router.get('/:id/commentaires', authenticate, consulterCommentaires);
router.post('/:id/commentaires', authenticate, ajouterCommentaire);

router.patch('/:id/vu', authenticate, marquerCommeVu);
router.patch('/:id/statut', authenticate, authorize('TECHNICIEN_IT', 'ADMINISTRATEUR'), changerStatut);
router.patch('/:id/priorite', authenticate, authorize('TECHNICIEN_IT', 'ADMINISTRATEUR'), changerPriorite);
router.patch('/:id/assigner', authenticate, authorize('TECHNICIEN_IT', 'ADMINISTRATEUR'), assignerTicket);
router.patch('/:id/confirmer-resolution', authenticate, confirmerResolution);

export default router;