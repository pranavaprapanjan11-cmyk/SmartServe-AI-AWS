// File: backend/src/modules/ai-operations/aiOperations.routes.ts

import { Router } from 'express';
import { authenticateJWT } from '../auth/auth.middleware';
import { getAnalytics, getEvents, postEvent } from './aiOperations.controller';

const router = Router();

router.get('/analytics', authenticateJWT, getAnalytics);
router.get('/events', authenticateJWT, getEvents);
router.post('/events', authenticateJWT, postEvent);

export default router;
