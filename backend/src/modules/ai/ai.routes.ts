import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import { Role } from '../auth/auth.types';
import {
  fetchHealthScore,
  fetchInventoryForecast,
  fetchMenuInsights,
  fetchRecommendations,
  fetchSalesForecast,
  fetchAiChat,
  fetchAiSummary,
  fetchAiReport,
} from './ai.controller';

const router = Router();

router.get('/debug', (req, res) => {
  res.json({
    geminiKeyLoaded: !!process.env.GEMINI_API_KEY,
    aiRouteLoaded: true,
    environment: process.env.NODE_ENV || 'production',
    model: 'gemini-2.5-flash'
  });
});

router.use(authenticateJWT);

router.get('/sales-forecast', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchSalesForecast);
router.get('/inventory-forecast', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchInventoryForecast);
router.get('/menu-insights', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchMenuInsights);
router.get('/recommendations', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchRecommendations);
router.get('/health-score', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchHealthScore);

router.post('/chat', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchAiChat);
router.get('/summary', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchAiSummary);
router.get('/report', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchAiReport);

export default router;
