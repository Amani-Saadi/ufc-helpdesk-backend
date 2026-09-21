import { Router } from 'express';
import multer from 'multer'; // <- Ajoutez ceci
import { ajouterFichierJoint, telechargerFichier } from '../controllers/file.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // <- Ajoutez ceci

router.post('/tickets/:ticketId/attachments', authenticate, upload.single('fichier'), ajouterFichierJoint);
router.get('/attachments/:id/download', authenticate, telechargerFichier);

export default router;