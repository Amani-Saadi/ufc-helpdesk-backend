import { Router } from 'express';
import authRoutes from './auth.routes.js';
import ticketRoutes from './ticket.routes.js';
import fileRoutes from './file.routes.js';
import commentRoutes from './comment.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';
import departmentRoutes from './department.routes.js';
import categoryRoutes from './category.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/', fileRoutes);
router.use('/', commentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/departments', departmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/users', userRoutes);

export default router;
