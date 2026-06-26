import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import * as kitchenService from '../../services/kitchenService';
import * as inventoryService from '../../services/inventoryService';
import OrderCard from './OrderCard';
import KitchenMetrics from './KitchenMetrics';
import { triggerLiveActivity } from '../../utils/activityTrigger';

// Reusable Empty State component for columns
const EmptyColumnState: React.FC<{ type: 'NEW' | 'COOKING' | 'READY' }> = ({ type }) => {
  const getMessage = () => {
    switch (type) {
      case 'NEW':
        return 'No orders waiting';
      case 'COOKING':
        return 'Kitchen is clear';
      case 'READY':
        return 'No dishes waiting to serve';
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case 'NEW':
        return 'text-sky-400/30';
      case 'COOKING':
        return 'text-amber-400/30';
      case 'READY':
        return 'text-emerald-400/30';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-white/5 bg-white/[0.01]">
      <svg className={`h-12 w-12 ${getAccentColor()}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
      <p className="mt-4 text-sm text-slate-500 font-medium">{getMessage()}</p>
    </div>
  );
};

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playChime = (time: number, freq: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.start(time);
      osc.stop(time + duration);
    };
    
    const now = audioCtx.currentTime;
    playChime(now, 587.33, 0.4);
    playChime(now + 0.15, 880, 0.5);
  } catch (e) {
    console.error('Failed to play notification sound', e);
  }
};

const KitchenDashboard: React.FC = () => {
  const { token, sseActive, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [preparing, setPreparing] = useState<any[]>([]);
  const [ready, setReady] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<string[]>([]);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);
  const newOrdersEndRef = useRef<HTMLDivElement>(null);

  // SSE connection status logging
  useEffect(() => {
    if (sseActive && user) {
      console.log('Kitchen SSE Connected');
      console.log('Workspace ID:', user.workspace_id);
      console.log('User Role:', user.role);
      console.log('Connection Status:', sseActive ? 'Connected' : 'Disconnected');
    }
  }, [sseActive, user]);

  // Scroll to newest order in NEW ORDERS column
  useEffect(() => {
    if (newOrdersEndRef.current) {
      newOrdersEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [newOrders.length]);

  const load = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    try {
      const res = await kitchenService.getKitchenOrders(token);
      const incomingNewOrders = res.newOrders || [];
      const incomingPreparing = res.preparing || [];
      const incomingReady = res.ready || [];

      const currentIncomingIds = new Set([
        ...incomingNewOrders.map((o: any) => o.id),
        ...incomingPreparing.map((o: any) => o.id),
        ...incomingReady.map((o: any) => o.id)
      ]);

      if (!isFirstLoadRef.current) {
        const newlyArrivedIds: string[] = [];
        incomingNewOrders.forEach((o: any) => {
          if (!prevOrderIdsRef.current.has(o.id)) {
            newlyArrivedIds.push(o.id);
          }
        });

        if (newlyArrivedIds.length > 0) {
          playNotificationSound();
          setHighlightedOrderIds((prev) => [...prev, ...newlyArrivedIds]);
          
          setTimeout(() => {
            setHighlightedOrderIds((prev) => prev.filter((id) => !newlyArrivedIds.includes(id)));
          }, 8000);
        }
      } else {
        isFirstLoadRef.current = false;
      }

      prevOrderIdsRef.current = currentIncomingIds;

      setNewOrders(incomingNewOrders);
      setPreparing(incomingPreparing);
      setReady(incomingReady);
      
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load kitchen orders', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load(true);
    
    const onUpdate = () => load(false);

    const handleOrderCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const order = customEvent.detail;
      if (!order) return;

      console.log('Kitchen received order_created event:', order);

      // Verify role filtering
      const isKitchenUser = user && (
        user.role === 'KITCHEN' ||
        user.role === 'CHEF' ||
        user.role === 'KITCHEN_STAFF' ||
        user.role?.toUpperCase() === 'CHEF' ||
        user.role?.toUpperCase() === 'KITCHEN' ||
        user.role?.toUpperCase() === 'KITCHEN_STAFF'
      );

      if (!isKitchenUser) {
        console.warn(`User role is not KITCHEN or CHEF. Skipping order_created event.`);
        return;
      }

      // Verify workspace matching
      const userWsId = user?.workspace_id;
      const orderWsId = order.workspace_id || order.workspaceId;
      if (!userWsId || !orderWsId || userWsId !== orderWsId) {
        console.warn('Workspace ID mismatch. Skipping order_created event.');
        return;
      }

      // Process and update state immediately
      const processOrder = (prev: any[]) => {
        if (prev.some((o) => o.id === order.id)) return prev;

        // Play chime and trigger flash
        playNotificationSound();
        setHighlightedOrderIds((hPrev) => {
          if (hPrev.includes(order.id)) return hPrev;
          return [...hPrev, order.id];
        });
        setTimeout(() => {
          setHighlightedOrderIds((hPrev) => hPrev.filter((id) => id !== order.id));
        }, 8000);

        return [...prev, order];
      };

      if (order.status === 'NEW') {
        setNewOrders((prev) => processOrder(prev));
      } else if (order.status === 'PREPARING' || order.status === 'SENT_TO_KITCHEN') {
        setPreparing((prev) => processOrder(prev));
      } else if (order.status === 'READY') {
        setReady((prev) => processOrder(prev));
      }
    };

    const handleOrderUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const order = customEvent.detail;
      if (!order) return;

      console.log('Kitchen received order_updated event:', order);

      // Verify workspace matching
      const userWsId = user?.workspace_id;
      const orderWsId = order.workspace_id || order.workspaceId;
      if (!userWsId || !orderWsId || userWsId !== orderWsId) return;

      // Remove from all queues
      setNewOrders((prev) => prev.filter((o) => o.id !== order.id));
      setPreparing((prev) => prev.filter((o) => o.id !== order.id));
      setReady((prev) => prev.filter((o) => o.id !== order.id));

      // Append to the correct column
      if (order.status === 'NEW') {
        setNewOrders((prev) => [...prev.filter((o) => o.id !== order.id), order]);
      } else if (order.status === 'PREPARING' || order.status === 'SENT_TO_KITCHEN') {
        setPreparing((prev) => [...prev.filter((o) => o.id !== order.id), order]);
      } else if (order.status === 'READY') {
        setReady((prev) => [...prev.filter((o) => o.id !== order.id), order]);
      }
    };

    const handleOrderCompleted = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      if (!data) return;
      const orderId = data.id || data;

      console.log('Kitchen received order_completed event for ID:', orderId);
      setNewOrders((prev) => prev.filter((o) => o.id !== orderId));
      setPreparing((prev) => prev.filter((o) => o.id !== orderId));
      setReady((prev) => prev.filter((o) => o.id !== orderId));
    };

    const handleOrderCancelled = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      if (!data) return;
      const orderId = data.id || data;

      console.log('Kitchen received order_cancelled event for ID:', orderId);
      setNewOrders((prev) => prev.filter((o) => o.id !== orderId));
      setPreparing((prev) => prev.filter((o) => o.id !== orderId));
      setReady((prev) => prev.filter((o) => o.id !== orderId));
    };

    window.addEventListener('ordersUpdated', onUpdate);
    window.addEventListener('order_created', handleOrderCreated);
    window.addEventListener('order_updated', handleOrderUpdated);
    window.addEventListener('order_completed', handleOrderCompleted);
    window.addEventListener('order_cancelled', handleOrderCancelled);

    const pollInterval = sseActive ? 10000 : 2000;
    const iv = setInterval(() => load(false), pollInterval);

    return () => {
      window.removeEventListener('ordersUpdated', onUpdate);
      window.removeEventListener('order_created', handleOrderCreated);
      window.removeEventListener('order_updated', handleOrderUpdated);
      window.removeEventListener('order_completed', handleOrderCompleted);
      window.removeEventListener('order_cancelled', handleOrderCancelled);
      clearInterval(iv);
    };
  }, [load, sseActive, user]);

  const handleAction = async (order: any) => {
    if (!token) return;
    try {
      if (order.status === 'NEW') {
        await kitchenService.startCooking(order.id, token);
        triggerLiveActivity('cookingStarted', { orderId: order.id });
      } else if (order.status === 'PREPARING' || order.status === 'SENT_TO_KITCHEN') {
        await kitchenService.markReady(order.id, token);
        triggerLiveActivity('orderReady', { orderId: order.id, tableNumber: order.table_number });
      } else if (order.status === 'READY') {
        await kitchenService.markServed(order.id, token);
        triggerLiveActivity('orderServed', { orderId: order.id, tableNumber: order.table_number });
      }

      // notify other panels
      window.dispatchEvent(new CustomEvent('ordersUpdated'));
      // local refresh
      await load();
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const handleRemake = async (orderId: string, itemId: string, reason: string) => {
    if (!token) return;
    try {
      setLoading(true);
      await inventoryService.remakeOrderItem(orderId, itemId, reason, token);
      window.dispatchEvent(new CustomEvent('ordersUpdated'));
      await load();
      alert('Dish remake request sent successfully! Inventory waste logged.');
    } catch (err: any) {
      console.error('Failed to remake item:', err);
      alert('Error remaking item: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Kitchen</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Kitchen Display System</h2>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-slate-500 font-medium">
              Last Updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={() => load()}
            className="rounded-2xl bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-400/20 hover:bg-cyan-500/15 transition-all active:scale-[0.97]"
          >
            Refresh
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.45fr_0.55fr]">
        {/* Kanban Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border surface-border surface-panel p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* NEW ORDERS Column */}
            <div className="flex flex-col h-full min-h-[60vh]">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">NEW ORDERS</h3>
                </div>
                <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 ring-1 ring-sky-400/20">
                  {newOrders.length}
                </span>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[65vh] pr-1">
                {loading && newOrders.length === 0 ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  </div>
                ) : newOrders.length === 0 ? (
                  <EmptyColumnState type="NEW" />
                ) : (
                  <>
                    <AnimatePresence mode="popLayout">
                      {newOrders.map((o) => (
                        <OrderCard key={o.id} order={o} onAction={handleAction} onRemake={handleRemake} columnType="NEW" isNew={highlightedOrderIds.includes(o.id)} />
                      ))}
                    </AnimatePresence>
                    <div ref={newOrdersEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* COOKING Column */}
            <div className="flex flex-col h-full min-h-[60vh]">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">COOKING</h3>
                </div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-400/20">
                  {preparing.length}
                </span>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[65vh] pr-1">
                {preparing.length === 0 ? (
                  <EmptyColumnState type="COOKING" />
                ) : (
                  <AnimatePresence mode="popLayout">
                    {preparing.map((o) => (
                      <OrderCard key={o.id} order={o} onAction={handleAction} onRemake={handleRemake} columnType="COOKING" isNew={highlightedOrderIds.includes(o.id)} />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* READY Column */}
            <div className="flex flex-col h-full min-h-[60vh]">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">READY</h3>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-400/20">
                  {ready.length}
                </span>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[65vh] pr-1">
                {ready.length === 0 ? (
                  <EmptyColumnState type="READY" />
                ) : (
                  <AnimatePresence mode="popLayout">
                    {ready.map((o) => (
                      <OrderCard key={o.id} order={o} onAction={handleAction} onRemake={handleRemake} columnType="READY" isNew={highlightedOrderIds.includes(o.id)} />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

          </div>
        </motion.div>

        {/* Metrics Sidebar */}
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border surface-border surface-panel p-6 shadow-2xl backdrop-blur-xl"
        >
          <KitchenMetrics orders={[...newOrders, ...preparing, ...ready]} />
        </motion.aside>
      </section>
    </div>
  );
};

export default KitchenDashboard;
