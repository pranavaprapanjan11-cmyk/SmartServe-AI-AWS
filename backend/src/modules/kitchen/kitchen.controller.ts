import { Response } from 'express';
import { RequestWithUser } from '../auth/auth.types';
import * as ordersService from '../orders/orders.service';
import { OrderStatus } from '../orders/orders.types';

export async function getKitchenOrders(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const groupedOrders = await ordersService.getKitchenOrders(userId, role);
    return res.json(groupedOrders);
  } catch (err: any) {
    console.error('getKitchenOrders error:', err);
    return res.status(500).json({ message: 'Failed to fetch kitchen orders' });
  }
}

export async function startCooking(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const updated = await ordersService.updateOrderStatus(userId, role, id, OrderStatus.PREPARING);
    return res.json(updated);
  } catch (err: any) {
    console.error('startCooking error:', err);
    if (err.message.includes('not found') || err.message.includes('unauthorized')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to update order status to preparing' });
  }
}

export async function ready(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const updated = await ordersService.updateOrderStatus(userId, role, id, OrderStatus.READY);
    return res.json(updated);
  } catch (err: any) {
    console.error('ready error:', err);
    if (err.message.includes('not found') || err.message.includes('unauthorized')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to update order status to ready' });
  }
}

export async function served(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const updated = await ordersService.updateOrderStatus(userId, role, id, OrderStatus.SERVED);
    return res.json(updated);
  } catch (err: any) {
    console.error('served error:', err);
    if (err.message.includes('not found') || err.message.includes('unauthorized')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message || 'Failed to update order status to served' });
  }
}
