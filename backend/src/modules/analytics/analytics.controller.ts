import { Response } from 'express';
import { RequestWithUser } from '../auth/auth.types';
import { getAnalyticsDashboard } from './analytics.service';

export async function getDashboard(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const dashboard = await getAnalyticsDashboard(userId, role);
    return res.json(dashboard);
  } catch (err: any) {
    console.error('getDashboard error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch analytics dashboard' });
  }
}
