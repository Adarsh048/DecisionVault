import { Router } from 'express';
import authRoutes from './authRoutes';
import organizationRoutes from './organizationRoutes';
import teamRoutes from './teamRoutes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'DecisionVault API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// Feature routes
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/organizations/:orgId/teams', teamRoutes);
// router.use('/decisions', decisionRoutes);  // Phase 5
// router.use('/comments', commentRoutes);    // Phase 5
// router.use('/search', searchRoutes);       // Phase 10

export default router;

