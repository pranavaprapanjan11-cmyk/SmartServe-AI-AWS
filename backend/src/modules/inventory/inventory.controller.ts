import { Response } from 'express';
import { RequestWithUser } from '../auth/auth.types';
import * as inventoryService from './inventory.service';
import { CreateInventoryItemPayload, UpdateInventoryItemPayload } from './inventory.types';

// ==========================================
// INVENTORY ITEMS
// ==========================================

export async function fetchInventoryItems(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const items = await inventoryService.getInventoryItems(req.user.id, req.user.role);
    return res.json(items);
  } catch (err: any) {
    console.error('fetchInventoryItems error:', err);
    return res.status(500).json({ message: 'Failed to fetch inventory items' });
  }
}

export async function fetchLowStockItems(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const items = await inventoryService.listLowStockItems(req.user.id, req.user.role);
    return res.json(items);
  } catch (err: any) {
    console.error('fetchLowStockItems error:', err);
    return res.status(500).json({ message: 'Failed to fetch low stock inventory items' });
  }
}

export async function fetchInventoryItem(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = req.params as { id: string };
    const item = await inventoryService.getInventoryItemById(req.user.id, req.user.role, id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    return res.json(item);
  } catch (err: any) {
    console.error('fetchInventoryItem error:', err);
    return res.status(500).json({ message: 'Failed to fetch inventory item' });
  }
}

export async function createInventoryItem(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const payload = req.body as unknown as CreateInventoryItemPayload;
    const item = await inventoryService.createInventoryItem(req.user.id, req.user.role, payload);
    return res.status(201).json(item);
  } catch (err: any) {
    console.error('createInventoryItem error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Inventory item name already exists' });
    }
    return res.status(500).json({ message: err.message || 'Failed to create inventory item' });
  }
}

export async function updateInventoryItem(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = req.params as { id: string };
    const payload = req.body as UpdateInventoryItemPayload;
    const item = await inventoryService.updateInventoryItem(req.user.id, req.user.role, id, payload);
    return res.json(item);
  } catch (err: any) {
    console.error('updateInventoryItem error:', err);
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message || 'Failed to update inventory item' });
  }
}

export async function deleteInventoryItem(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = req.params as { id: string };
    await inventoryService.deleteInventoryItem(req.user.id, req.user.role, id);
    return res.json({ message: 'Inventory item deleted successfully' });
  } catch (err: any) {
    console.error('deleteInventoryItem error:', err);
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message || 'Failed to delete inventory item' });
  }
}

// ==========================================
// RECIPES
// ==========================================

export async function fetchRecipeForMenuItem(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { menuItemId } = req.params as { menuItemId: string };
    const recipe = await inventoryService.getRecipeForMenuItem(req.user.id, req.user.role, menuItemId);
    return res.json(recipe);
  } catch (err: any) {
    console.error('fetchRecipeForMenuItem error:', err);
    return res.status(500).json({ message: 'Failed to fetch recipe for menu item' });
  }
}

export async function saveRecipeForMenuItem(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { menuItemId } = req.params as { menuItemId: string };
    const { recipe } = req.body as { recipe: any };
    const saved = await inventoryService.saveRecipeForMenuItem(req.user.id, req.user.role, menuItemId, recipe);
    return res.status(201).json(saved);
  } catch (err: any) {
    console.error('saveRecipeForMenuItem error:', err);
    return res.status(500).json({ message: err.message || 'Failed to save recipe for menu item' });
  }
}

// ==========================================
// REMAKE ORDER ITEM
// ==========================================

export async function remakeItem(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { orderId, itemId } = req.params as { orderId: string; itemId: string };
    const { reason } = req.body as { reason?: string };
    const result = await inventoryService.remakeOrderItem(req.user.id, req.user.role, orderId, itemId, reason || 'Burnt / Kitchen error');
    return res.json(result);
  } catch (err: any) {
    console.error('remakeItem error:', err);
    return res.status(500).json({ message: err.message || 'Failed to log remake item' });
  }
}

// ==========================================
// SUPPLIERS
// ==========================================

export async function fetchSuppliers(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const suppliers = await inventoryService.getSuppliers(req.user.id, req.user.role);
    return res.json(suppliers);
  } catch (err: any) {
    console.error('fetchSuppliers error:', err);
    return res.status(500).json({ message: 'Failed to fetch suppliers' });
  }
}

export async function fetchSupplier(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = req.params as { id: string };
    const supplier = await inventoryService.getSupplierById(req.user.id, req.user.role, id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    return res.json(supplier);
  } catch (err: any) {
    console.error('fetchSupplier error:', err);
    return res.status(500).json({ message: 'Failed to fetch supplier' });
  }
}

export async function createSupplier(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const supplier = await inventoryService.createSupplier(req.user.id, req.user.role, req.body as any);
    return res.status(201).json(supplier);
  } catch (err: any) {
    console.error('createSupplier error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create supplier' });
  }
}

export async function updateSupplier(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = req.params as { id: string };
    const supplier = await inventoryService.updateSupplier(req.user.id, req.user.role, id, req.body as any);
    return res.json(supplier);
  } catch (err: any) {
    console.error('updateSupplier error:', err);
    return res.status(500).json({ message: err.message || 'Failed to update supplier' });
  }
}

export async function deleteSupplier(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = req.params as { id: string };
    await inventoryService.deleteSupplier(req.user.id, req.user.role, id);
    return res.json({ message: 'Supplier deleted successfully' });
  } catch (err: any) {
    console.error('deleteSupplier error:', err);
    return res.status(500).json({ message: err.message || 'Failed to delete supplier' });
  }
}

// ==========================================
// PURCHASE ORDERS
// ==========================================

export async function fetchPurchaseOrders(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const pos = await inventoryService.getPurchaseOrders(req.user.id, req.user.role);
    return res.json(pos);
  } catch (err: any) {
    console.error('fetchPurchaseOrders error:', err);
    return res.status(500).json({ message: 'Failed to fetch purchase orders' });
  }
}

export async function fetchPurchaseOrder(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = req.params as { id: string };
    const po = await inventoryService.getPurchaseOrderById(req.user.id, req.user.role, id);
    if (!po) return res.status(404).json({ message: 'Purchase order not found' });
    return res.json(po);
  } catch (err: any) {
    console.error('fetchPurchaseOrder error:', err);
    return res.status(500).json({ message: 'Failed to fetch purchase order' });
  }
}

export async function createPurchaseOrder(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const po = await inventoryService.createPurchaseOrder(req.user.id, req.user.role, req.body);
    return res.status(201).json(po);
  } catch (err: any) {
    console.error('createPurchaseOrder error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create purchase order' });
  }
}

export async function updatePurchaseOrderStatus(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: any };
    const po = await inventoryService.updatePurchaseOrderStatus(req.user.id, req.user.role, id, status);
    return res.json(po);
  } catch (err: any) {
    console.error('updatePurchaseOrderStatus error:', err);
    return res.status(500).json({ message: err.message || 'Failed to update purchase order status' });
  }
}

export async function deletePurchaseOrder(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = req.params as { id: string };
    await inventoryService.deletePurchaseOrder(req.user.id, req.user.role, id);
    return res.json({ message: 'Purchase order deleted successfully' });
  } catch (err: any) {
    console.error('deletePurchaseOrder error:', err);
    return res.status(500).json({ message: err.message || 'Failed to delete purchase order' });
  }
}

// ==========================================
// WASTAGE
// ==========================================

export async function fetchWastageList(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const list = await inventoryService.getWastageList(req.user.id, req.user.role);
    return res.json(list);
  } catch (err: any) {
    console.error('fetchWastageList error:', err);
    return res.status(500).json({ message: 'Failed to fetch wastage logs' });
  }
}

export async function createWastage(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const w = await inventoryService.createWastage(req.user.id, req.user.role, req.body);
    return res.status(201).json(w);
  } catch (err: any) {
    console.error('createWastage error:', err);
    return res.status(500).json({ message: err.message || 'Failed to record wastage' });
  }
}

export async function fetchWastageAnalytics(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const analytics = await inventoryService.getWastageAnalytics(req.user.id, req.user.role);
    return res.json(analytics);
  } catch (err: any) {
    console.error('fetchWastageAnalytics error:', err);
    return res.status(500).json({ message: 'Failed to fetch wastage analytics' });
  }
}

// ==========================================
// FORECASTING
// ==========================================

export async function fetchInventoryForecast(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const forecast = await inventoryService.getInventoryForecast(req.user.id, req.user.role);
    return res.json(forecast);
  } catch (err: any) {
    console.error('fetchInventoryForecast error:', err);
    return res.status(500).json({ message: 'Failed to compute inventory forecast' });
  }
}

// ==========================================
// RECONCILIATIONS
// ==========================================

export async function fetchReconciliations(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const list = await inventoryService.getReconciliationHistory(req.user.id, req.user.role);
    return res.json(list);
  } catch (err: any) {
    console.error('fetchReconciliations error:', err);
    return res.status(500).json({ message: 'Failed to fetch reconciliation history' });
  }
}

export async function fetchLatestReconciliation(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const rec = await inventoryService.getLatestReconciliation(req.user.id, req.user.role);
    return res.json(rec);
  } catch (err: any) {
    console.error('fetchLatestReconciliation error:', err);
    return res.status(500).json({ message: 'Failed to fetch latest reconciliation' });
  }
}

export async function submitReconciliation(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const rec = await inventoryService.submitReconciliation(req.user.id, req.user.role, req.body);
    return res.status(201).json(rec);
  } catch (err: any) {
    console.error('submitReconciliation error:', err);
    return res.status(500).json({ message: err.message || 'Failed to submit reconciliation' });
  }
}

export async function fetchTransactions(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const txs = await inventoryService.getTransactions(req.user.id, req.user.role);
    return res.json(txs);
  } catch (err: any) {
    console.error('fetchTransactions error:', err);
    return res.status(500).json({ message: 'Failed to fetch inventory transactions' });
  }
}

export async function fetchAuditForm(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const form = await inventoryService.getAuditForm(req.user.id, req.user.role);
    return res.json(form);
  } catch (err: any) {
    console.error('fetchAuditForm error:', err);
    return res.status(500).json({ message: 'Failed to fetch reconciliation audit form' });
  }
}


