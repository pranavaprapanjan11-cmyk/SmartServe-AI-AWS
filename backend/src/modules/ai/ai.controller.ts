import { Response } from 'express';
import { RequestWithUser } from '../auth/auth.types';
import {
  getHealthScore,
  getInventoryForecast,
  getMenuInsights,
  getRecommendations,
  getSalesForecast,
  getChatResponse,
  getAiSummary,
  getAiReport,
} from './ai.service';

export async function fetchSalesForecast(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await getSalesForecast(req.user.id, req.user.role);
    return res.json(result);
  } catch (err: any) {
    console.error('fetchSalesForecast error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch sales forecast' });
  }
}

export async function fetchInventoryForecast(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await getInventoryForecast(req.user.id, req.user.role);
    return res.json(result);
  } catch (err: any) {
    console.error('fetchInventoryForecast error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch inventory forecast' });
  }
}

export async function fetchMenuInsights(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await getMenuInsights(req.user.id, req.user.role);
    return res.json(result);
  } catch (err: any) {
    console.error('fetchMenuInsights error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch menu insights' });
  }
}

export async function fetchRecommendations(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await getRecommendations(req.user.id, req.user.role);
    return res.json(result);
  } catch (err: any) {
    console.error('fetchRecommendations error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch recommendations' });
  }
}

export async function fetchHealthScore(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await getHealthScore(req.user.id, req.user.role);
    return res.json(result);
  } catch (err: any) {
    console.error('fetchHealthScore error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch health score' });
  }
}

export async function fetchAiChat(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { message, history } = req.body as { message: string; history: any[] };
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const responseText = await getChatResponse(
      req.user.id,
      req.user.role,
      message,
      history || []
    );
    return res.json({ response: responseText });
  } catch (err: any) {
    console.error('fetchAiChat error:', err);
    return res.status(500).json({ message: err.message || 'Failed to get chat response' });
  }
}

export async function fetchAiSummary(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const summaryText = await getAiSummary(req.user.id, req.user.role);
    return res.json({ summary: summaryText });
  } catch (err: any) {
    console.error('fetchAiSummary error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch AI summary' });
  }
}

export async function fetchAiReport(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const reportData = await getAiReport(req.user.id, req.user.role);
    return res.json(reportData);
  } catch (err: any) {
    console.error('fetchAiReport error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch AI report' });
  }
}
