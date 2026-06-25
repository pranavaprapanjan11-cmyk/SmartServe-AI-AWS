// File: backend/src/modules/menu/menu.controller.ts
// Controller for menu routes: handles requests and responses

import { Request, Response } from 'express';
import * as menuService from './menu.service';
import { CreateMenuItemPayload, UpdateMenuItemPayload } from './menu.types';

// ==================== MENU ITEMS ENDPOINTS ====================

export async function createMenuItem(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.id;
    if (!restaurantId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const payload: CreateMenuItemPayload = req.body;
    const menuItem = await menuService.createMenuItem(restaurantId, payload);
    return res.status(201).json(menuItem);
  } catch (err: any) {
    console.error('createMenuItem error:', err);
    if (err.message.includes('Category not found')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to create menu item' });
  }
}

export async function getMenuItems(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.id;
    if (!restaurantId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const items = await menuService.getMenuItems(restaurantId);
    return res.json(items);
  } catch (err) {
    console.error('getMenuItems error:', err);
    return res.status(500).json({ message: 'Failed to fetch menu items' });
  }
}

export async function getMenuItemById(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.id;
    const { id } = req.params;

    if (!restaurantId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const item = await menuService.getMenuItemById(restaurantId, id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    return res.json(item);
  } catch (err) {
    console.error('getMenuItemById error:', err);
    return res.status(500).json({ message: 'Failed to fetch menu item' });
  }
}

export async function updateMenuItem(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.id;
    const { id } = req.params;
    const payload: UpdateMenuItemPayload = req.body;

    if (!restaurantId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const updated = await menuService.updateMenuItem(restaurantId, id, payload);
    return res.json(updated);
  } catch (err: any) {
    console.error('updateMenuItem error:', err);
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to update menu item' });
  }
}

export async function deleteMenuItem(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.id;
    const { id } = req.params;

    if (!restaurantId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await menuService.deleteMenuItem(restaurantId, id);
    return res.json({ message: 'Menu item deleted successfully' });
  } catch (err: any) {
    console.error('deleteMenuItem error:', err);
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to delete menu item' });
  }
}

export async function toggleMenuItemAvailability(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.id;
    const { id } = req.params;
    const { is_available } = req.body;

    if (!restaurantId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (typeof is_available !== 'boolean') {
      return res.status(400).json({ message: 'is_available must be a boolean' });
    }

    const updated = await menuService.toggleMenuItemAvailability(restaurantId, id, is_available);
    return res.json(updated);
  } catch (err: any) {
    console.error('toggleMenuItemAvailability error:', err);
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to toggle availability' });
  }
}

// ==================== MENU CATEGORIES ENDPOINTS ====================

export async function createMenuCategory(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.id;
    if (!restaurantId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const category = await menuService.createMenuCategory(restaurantId, req.body);
    return res.status(201).json(category);
  } catch (err: any) {
    console.error('createMenuCategory error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Category name already exists' });
    }
    return res.status(500).json({ message: 'Failed to create category' });
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.id;
    if (!restaurantId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const categories = await menuService.getCategories(restaurantId);
    return res.json(categories);
  } catch (err) {
    console.error('getCategories error:', err);
    return res.status(500).json({ message: 'Failed to fetch categories' });
  }
}

// ==================== MENU STATISTICS ====================

export async function getMenuStats(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.id;
    if (!restaurantId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const stats = await menuService.getMenuStats(restaurantId);
    return res.json(stats);
  } catch (err) {
    console.error('getMenuStats error:', err);
    return res.status(500).json({ message: 'Failed to fetch menu statistics' });
  }
}

// ==================== SEARCH ====================

export async function searchMenuItems(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.id;
    const { q, category_id } = req.query;

    if (!restaurantId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Query parameter "q" is required' });
    }

    const results = await menuService.searchMenuItems(
      restaurantId,
      q,
      category_id as string | undefined
    );
    return res.json(results);
  } catch (err) {
    console.error('searchMenuItems error:', err);
    return res.status(500).json({ message: 'Failed to search menu items' });
  }
}
