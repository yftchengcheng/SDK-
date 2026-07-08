import { Router } from 'express';
import authRoutes from './auth';
import appRoutes from './app';
import placementRoutes from './placement';
import adSourceRoutes from './ad-source';
import waterfallRoutes from './waterfall';
import trafficGroupRoutes from './traffic-group';
import sdkRoutes from './sdk';
import reportRoutes from './report';
import dashboardRoutes from './dashboard';
import reconciliationRoutes from './reconciliation';
import messageRoutes from './message';
import networkRoutes from './network';
import profileRoutes from './profile';
import halRoutes from './hal';
import adminRoutes from './admin';

const router = Router();

// Health check
router.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.use('/api/v1/auth', authRoutes);

// Console routes (require auth)
router.use('/api/v1/console/app', appRoutes);
router.use('/api/v1/console/placement', placementRoutes);
router.use('/api/v1/console/ad-source', adSourceRoutes);
router.use('/api/v1/console/waterfall', waterfallRoutes);
router.use('/api/v1/console/traffic-group', trafficGroupRoutes);
router.use('/api/v1/console/dashboard', dashboardRoutes);
router.use('/api/v1/console/report', reportRoutes);
router.use('/api/v1/console/reconciliation', reconciliationRoutes);
router.use('/api/v1/console/message', messageRoutes);
router.use('/api/v1/console/network', networkRoutes);
router.use('/api/v1/console/profile', profileRoutes);
router.use('/api/v1/console/admin', adminRoutes);
router.use('/api/v1/hal', halRoutes);

// Public SDK routes
router.use('/api/v1/sdk', sdkRoutes);

// Public report endpoint
router.use('/api/v1/report', reportRoutes);

export default router;
