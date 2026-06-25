export interface InventoryItem {
  id: string;
  restaurant_id: string;
  category_id?: string;
  supplier_id?: string;
  name: string;
  description?: string;
  unit: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  expiry_date?: string;
  batch_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryItemPayload {
  name: string;
  description?: string;
  unit: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  expiry_date?: string;
  batch_number?: string;
  category_id?: string;
  supplier_id?: string;
  is_active?: boolean;
}

export interface UpdateInventoryItemPayload {
  name?: string;
  description?: string;
  unit?: string;
  quantity_on_hand?: number;
  reorder_threshold?: number;
  expiry_date?: string;
  batch_number?: string;
  category_id?: string;
  supplier_id?: string;
  is_active?: boolean;
}

export interface MenuItemRecipeLine {
  inventory_item_id: string;
  quantity_required: number;
}

export interface MenuItemRecipe {
  id: string;
  menu_item_id: string;
  inventory_item_id: string;
  quantity_required: number;
  inventory_item_name: string;
  inventory_item_unit: string;
}

export interface Recipe {
  id: string;
  restaurant_id: string;
  menu_item_id: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  inventory_item_id: string;
  quantity_required: number;
  unit: string;
}

export interface Wastage {
  id: string;
  restaurant_id: string;
  inventory_item_id: string;
  inventory_item_name?: string;
  inventory_item_unit?: string;
  quantity: number;
  cost: number;
  reason: string;
  staff_member: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string;
  inventory_item_name?: string;
  unit?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface PurchaseOrder {
  id: string;
  restaurant_id: string;
  supplier_id: string;
  supplier_name?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DELIVERED' | 'CANCELLED';
  order_date: string;
  received_date?: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  ordered_items?: PurchaseOrderItem[];
}

export interface ForecastItem {
  itemId: string;
  itemName: string;
  unit: string;
  quantityOnHand: number;
  dailyRate: number;
  daysRemaining: number;
  depletionDate?: string;
}

export interface ReconciliationItemPayload {
  inventory_item_id: string;
  actual_stock: number;
}

export interface ReconciliationPayload {
  staff_member: string;
  items: ReconciliationItemPayload[];
}

