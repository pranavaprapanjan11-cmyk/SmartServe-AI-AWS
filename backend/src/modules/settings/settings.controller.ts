// File: backend/src/modules/settings/settings.controller.ts

import { Response } from 'express';
import { RequestWithUser } from '../auth/auth.types';
import {
  createPrinterSettings,
  getPrinterSettings,
  getRestaurantSettings,
  updatePrinterSettings,
  upsertRestaurantSettings,
} from './settings.service';

export async function fetchRestaurantSettings(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Not authenticated' });

    const settings = await getRestaurantSettings(userId, role);
    return res.json(settings || null);
  } catch (err: any) {
    console.error('fetchRestaurantSettings error:', err);
    return res.status(500).json({ message: 'Failed to fetch restaurant settings' });
  }
}

export async function saveRestaurantSettings(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Not authenticated' });

    const payload = req.body as any;
    const saved = await upsertRestaurantSettings(userId, role, payload);
    return res.json(saved);
  } catch (err: any) {
    console.error('saveRestaurantSettings error:', err);
    return res.status(500).json({ message: 'Failed to save restaurant settings' });
  }
}

export async function fetchPrinterSettings(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Not authenticated' });

    const printers = await getPrinterSettings(userId, role);
    return res.json(printers);
  } catch (err: any) {
    console.error('fetchPrinterSettings error:', err);
    return res.status(500).json({ message: 'Failed to fetch printer settings' });
  }
}

export async function savePrinterSettings(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };
    const payload = req.body as any;
    if (!userId || !role) return res.status(401).json({ message: 'Not authenticated' });

    const saved = await updatePrinterSettings(userId, role, id, payload);
    return res.json(saved);
  } catch (err: any) {
    console.error('savePrinterSettings error:', err);
    if (err.message?.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to save printer settings' });
  }
}

export async function createPrinterSetting(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Not authenticated' });

    const payload = req.body as any;
    const saved = await createPrinterSettings(userId, role, payload);
    return res.status(201).json(saved);
  } catch (err: any) {
    console.error('createPrinterSetting error:', err);
    return res.status(500).json({ message: 'Failed to create printer setting' });
  }
}
