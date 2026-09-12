import { Router } from 'express';
import { ajouterFichierJoint, telechargerFichier } from '../controllers/file.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/tickets/:ticketId/attachments', authenticate, upload.single('fichier'), ajouterFichierJoint);
router.get('/attachments/:id/download', authenticate, telechargerFichier);

export default router;
