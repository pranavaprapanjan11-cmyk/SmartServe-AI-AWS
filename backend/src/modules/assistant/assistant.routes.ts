import { Router } from 'express';
import { handleAssistantChat } from './assistant.controller';
import { authenticateJWT } from '../auth/auth.middleware';

const router = Router();

router.post('/chat', authenticateJWT, handleAssistantChat);

export default router;
