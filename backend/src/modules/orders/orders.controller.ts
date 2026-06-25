// File: backend/src/modules/orders/orders.controller.ts
// Controller for order routes: handles request and responses

import { Response } from 'express';
import { RequestWithUser } from '../auth/auth.types';
import * as ordersService from './orders.service';
import { CreateOrderPayload, UpdateOrderStatusPayload } from './orders.types';

export async function createOrder(req: RequestWithUser, res: Response) {
  try {
    const waiterId = req.user?.id;
    const waiterRole = req.user?.role;
    if (!waiterId || !waiterRole) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const payload = req.body as unknown as CreateOrderPayload;
    const order = await ordersService.createOrder(waiterId, waiterRole, payload);
    return res.status(201).json(order);
  } catch (err: any) {
    console.error('createOrder error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create order' });
  }
}

export async function getOrders(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const orders = await ordersService.getOrders(userId, role);
    return res.json(orders);
  } catch (err: any) {
    console.error('getOrders error:', err);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
}

export async function getOrderById(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };

    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const order = await ordersService.getOrderById(userId, role, id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(order);
  } catch (err: any) {
    console.error('getOrderById error:', err);
    return res.status(500).json({ message: 'Failed to fetch order details' });
  }
}

export async function getOrdersByTable(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const tableNumber = parseInt(String((req.params as Record<string, unknown>).tableNumber));

    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (isNaN(tableNumber)) {
      return res.status(400).json({ message: 'Invalid table number' });
    }

    const orders = await ordersService.getOrdersByTable(userId, role, tableNumber);
    return res.json(orders);
  } catch (err: any) {
    console.error('getOrdersByTable error:', err);
    return res.status(500).json({ message: 'Failed to fetch orders for table' });
  }
}

export async function updateOrderStatus(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };
    const { status } = req.body as unknown as UpdateOrderStatusPayload;

    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const updated = await ordersService.updateOrderStatus(userId, role, id, status);
    return res.json(updated);
  } catch (err: any) {
    console.error('updateOrderStatus error:', err);
    if (err.message.includes('not found') || err.message.includes('unauthorized')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to update order status' });
  }
}

export async function deleteOrder(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };

    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await ordersService.deleteOrder(userId, role, id);
    return res.json({ message: 'Order deleted successfully' });
  } catch (err: any) {
    console.error('deleteOrder error:', err);
    if (err.message.includes('not found') || err.message.includes('unauthorized')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to delete order' });
  }
}

export async function updateOrderItems(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };
    const { items } = req.body as { items: any[] };

    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items list is required' });
    }

    const updated = await ordersService.updateOrderItems(userId, role, id, items);
    return res.json(updated);
  } catch (err: any) {
    console.error('updateOrderItems error:', err);
    return res.status(500).json({ message: err.message || 'Failed to update order items' });
  }
}
