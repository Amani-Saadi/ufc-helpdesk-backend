import { Router } from 'express';
import { 
  ajouterCommentaire, 
  consulterCommentaires, 
  modifierCommentaire, 
  supprimerCommentaire 
} from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/tickets/:ticketId/comments', authenticate, ajouterCommentaire);
router.get('/tickets/:ticketId/comments', authenticate, consulterCommentaires);
router.put('/comments/:id', authenticate, modifierCommentaire);
router.delete('/comments/:id', authenticate, supprimerCommentaire);

export default router;
