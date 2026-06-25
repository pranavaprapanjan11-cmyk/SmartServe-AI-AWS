// File: frontend/src/pages/orders/CreateOrder.tsx
// Page to create a new order: select table, guest count, browse/search menu, and place order

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import * as menuService from '../../services/menuService';
import * as orderService from '../../services/orderService';
import { triggerLiveActivity } from '../../utils/activityTrigger';

interface SelectedItem {
  item: menuService.MenuItem;
  quantity: number;
}

const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  // Inputs
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data from backend
  const [menuItems, setMenuItems] = useState<menuService.MenuItem[]>([]);
  const [categories, setCategories] = useState<menuService.MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Cart
  const [cart, setCart] = useState<SelectedItem[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load table number from query param if available
  useEffect(() => {
    const tableParam = searchParams.get('table');
    if (tableParam) {
      const parsed = parseInt(tableParam);
      if (!isNaN(parsed)) {
        setTableNumber(parsed);
      }
    }
  }, [searchParams]);

  // Fetch menu data
  useEffect(() => {
    const loadMenuData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const [itemsData, categoriesData] = await Promise.all([
          menuService.getMenuItems(token),
          menuService.getCategories(token),
        ]);
        
        // Filter out unavailable items
        setMenuItems(itemsData.filter(i => i.is_available));
        setCategories(categoriesData.filter(c => c.is_active));
        setError(null);
      } catch (err: any) {
        console.error('Failed to load menu details:', err);
        setError('Failed to load menu items. Please check if menu categories and items are configured.');
      } finally {
        setLoading(false);
      }
    };

    loadMenuData();
  }, [token]);

  // Cart actions
  const addToCart = (item: menuService.MenuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((c) => c.item.id === item.id);
      if (existing) {
        return prevCart.map((c) => 
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prevCart, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return { ...c, quantity: newQty };
          }
          return c;
        })
        .filter((c) => c.quantity > 0);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((c) => c.item.id !== itemId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const tax = subtotal * 0.18; // Mock 18% GST
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (cart.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const payload: orderService.CreateOrderPayload = {
        table_number: tableNumber,
        guest_count: guestCount,
        items: cart.map((c) => ({
          menu_item_id: c.item.id,
          quantity: c.quantity,
        })),
      };

      const createdOrder = await orderService.createOrder(payload, token);
      triggerLiveActivity('orderCreated', { orderId: createdOrder.id });
      navigate(`/waiter/orders/${createdOrder.id}`);
    } catch (err: any) {
      console.error('Failed to submit order:', err);
      setError(err?.response?.data?.message || 'Failed to place order. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter items based on category and search query
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags && item.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-2 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button 
            type="button" 
            onClick={() => navigate('/waiter/dashboard')}
            className="text-sm text-cyan-400 hover:underline flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="mt-2 text-3xl font-bold tracking-wide">Create New Order</h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          
          {/* Menu Selection (Left) */}
          <div className="space-y-6">
            
            {/* Order Settings Form */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-cyan-300 mb-4">Order Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Table Number</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-2xl border border-white/10 bg-[#0c101c] px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Guest Count</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0c101c] hover:bg-white/5"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold w-8 text-center">{guestCount}</span>
                    <button
                      type="button"
                      onClick={() => setGuestCount(guestCount + 1)}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0c101c] hover:bg-white/5"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Search and Categories */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-lg font-semibold text-cyan-300">Browse Menu</h2>
              
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search by name, description, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0c101c] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider transition ${
                    selectedCategory === 'all'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  ALL
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider transition ${
                      selectedCategory === cat.id
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {cat.name.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Items List */}
              <div className="grid gap-4 sm:grid-cols-2 max-h-[400px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#090b14]/60 p-4"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-semibold truncate text-white">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-1">₹{item.price}</p>
                        {item.description && (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                      >
                        Add +
                      </button>
                    </motion.div>
                  ))}
                  {filteredItems.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                      No matching menu items found.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

          {/* Cart / Order Summary (Right) */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl h-fit flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 mb-4">Cart</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 mb-6">
                <AnimatePresence>
                  {cart.map((cartItem) => (
                    <motion.div
                      key={cartItem.item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-sm font-semibold truncate">{cartItem.item.name}</p>
                        <p className="text-xs text-slate-400">₹{cartItem.item.price} each</p>
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        {/* Quantity Controls */}
                        <div className="flex items-center rounded-xl border border-white/10 bg-black/40 px-2 py-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(cartItem.item.id, -1)}
                            className="text-slate-400 hover:text-white px-1 text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{cartItem.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(cartItem.item.id, 1)}
                            className="text-slate-400 hover:text-white px-1 text-xs"
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(cartItem.item.id)}
                          className="text-slate-500 hover:text-red-400 transition"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  
                  {cart.length === 0 && (
                    <div className="py-12 text-center text-slate-500 text-sm">
                      Cart is empty. Select items from the menu.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Calculations and Actions */}
            <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
              <div className="space-y-1.5 text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18% GST)</span>
                  <span className="text-white">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/5">
                  <span>Grand Total</span>
                  <span className="text-cyan-300">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || cart.length === 0}
                className="w-full rounded-2xl bg-cyan-500 py-3 text-center text-sm font-semibold text-slate-950 transition-all shadow-lg shadow-cyan-500/10 hover:bg-cyan-400 hover:shadow-cyan-400/20 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
              >
                {submitting ? 'SENDING TO KITCHEN...' : 'SEND TO KITCHEN'}
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default CreateOrder;
