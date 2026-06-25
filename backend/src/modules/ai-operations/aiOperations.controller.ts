// File: backend/src/modules/ai-operations/aiOperations.controller.ts

import { Response } from 'express';
import { RequestWithUser } from '../auth/auth.types';
import * as aiOperationsService from './aiOperations.service';
import { getRestaurantId } from '../orders/orders.service';

export async function getAnalytics(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const analytics = await aiOperationsService.getOperationalAnalytics(userId, role);
    return res.json(analytics);
  } catch (err: any) {
    console.error('getOperationalAnalytics error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch operations analytics' });
  }
}

export async function getEvents(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const events = await aiOperationsService.getLiveEventsList(userId, role);
    return res.json(events);
  } catch (err: any) {
    console.error('getLiveEventsList error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch operations events list' });
  }
}

export async function postEvent(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const restaurantId = await getRestaurantId(userId, role);
    const { eventType, description, payload } = req.body as { eventType: string; description: string; payload?: any };
    
    if (!eventType || !description) {
      return res.status(400).json({ message: 'eventType and description are required' });
    }

    const event = await aiOperationsService.logEvent(restaurantId, eventType as any, description, payload || {});
    return res.status(201).json(event);
  } catch (err: any) {
    console.error('logEvent error:', err);
    return res.status(500).json({ message: err.message || 'Failed to log event' });
  }
}
