// File: frontend/src/pages/restaurant/DigitalTwin.tsx
// Restaurant Digital Twin interface linked with real-time database orders

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import * as orderService from '../../services/orderService';
import { triggerLiveActivity } from '../../utils/activityTrigger';

interface TableState {
  id: string;
  number: number;
  seats: number;
  occupied: boolean;
  status: string;
  waiter: string;
  orderId?: string;
  totalAmount?: number;
  guestCount?: number;
}

const DigitalTwin: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [tables, setTables] = useState<TableState[]>([]);
  const [activeTable, setActiveTable] = useState<TableState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrdersAndBuildTwin = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const orders = await orderService.getOrders(token);

      // Map latest orders by table
      const latestOrderPerTable: { [key: number]: orderService.Order } = {};
      orders.forEach((order) => {
        const tableNum = order.table_number;
        const existing = latestOrderPerTable[tableNum];
        if (!existing || new Date(order.created_at) > new Date(existing.created_at)) {
          latestOrderPerTable[tableNum] = order;
        }
      });

      // Standard table layout structure for 12 tables
      const seatsLayout = [4, 2, 6, 4, 2, 8, 4, 4, 2, 6, 2, 4, 4, 2, 6, 4, 2, 8, 4, 4]; // 20 tables

      const twinTables: TableState[] = Array.from({ length: 20 }, (_, idx) => {
        const tableNum = idx + 1;
        const latestOrder = latestOrderPerTable[tableNum];
        
        let occupied = false;
        let status = 'Available';
        let waiter = '—';
        let orderId = undefined;
        let totalAmount = undefined;
        let guestCount = undefined;

        if (latestOrder) {
          orderId = latestOrder.id;
          totalAmount = latestOrder.total_amount;
          guestCount = latestOrder.guest_count;
          waiter = latestOrder.waiter_name || 'Waiter';

          if (latestOrder.status !== orderService.OrderStatus.PAID) {
            occupied = true;
            status = latestOrder.status;
          } else {
            status = 'PAID';
          }
        }

        return {
          id: `T${tableNum}`,
          number: tableNum,
          seats: seatsLayout[idx] || 4,
          occupied,
          status,
          waiter,
          orderId,
          totalAmount,
          guestCount,
        };
      });

      setTables(twinTables);
      
      // Keep selected active table updated
      if (activeTable) {
        const updatedActive = twinTables.find((t) => t.id === activeTable.id);
        if (updatedActive) {
          setActiveTable(updatedActive);
        }
      } else if (twinTables.length > 0) {
        setActiveTable(twinTables[0]);
      }
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch digital twin data:', err);
      setError('Failed to fetch table layout and orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndBuildTwin();
    const onOrdersUpdated = () => fetchOrdersAndBuildTwin();
    window.addEventListener('ordersUpdated', onOrdersUpdated);
    return () => window.removeEventListener('ordersUpdated', onOrdersUpdated);
  }, [token]);

  const getTableColor = (table: TableState) => {
    if (!table.orderId) {
      return {
        border: 'border-white/10',
        bg: 'bg-slate-900/50 hover:bg-white/5',
        badge: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-400/20',
        glow: 'shadow-slate-500/5',
        indicator: 'bg-slate-500',
      };
    }

    if (table.status === 'PAID') {
      return {
        border: 'border-emerald-400/30',
        bg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
        badge: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20',
        glow: 'shadow-emerald-500/10',
        indicator: 'bg-emerald-500',
      };
    }

    switch (table.status) {
      case orderService.OrderStatus.NEW:
        return {
          border: 'border-cyan-400/30',
          bg: 'bg-cyan-500/10 hover:bg-cyan-500/15',
          badge: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20',
          glow: 'shadow-cyan-500/10',
          indicator: 'bg-cyan-400',
        };
      case orderService.OrderStatus.SENT_TO_KITCHEN:
      case orderService.OrderStatus.PREPARING:
        return {
          border: 'border-amber-400/30',
          bg: 'bg-amber-500/10 hover:bg-amber-500/15',
          badge: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20',
          glow: 'shadow-amber-500/10',
          indicator: 'bg-amber-400',
        };
      case orderService.OrderStatus.READY:
      case orderService.OrderStatus.SERVED:
        return {
          border: 'border-green-400/30',
          bg: 'bg-green-500/10 hover:bg-green-500/15',
          badge: 'bg-green-500/15 text-green-300 ring-1 ring-green-400/20',
          glow: 'shadow-green-500/10',
          indicator: 'bg-green-400',
        };
      default:
        return {
          border: 'border-white/10',
          bg: 'bg-slate-900/50 hover:bg-white/5',
          badge: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-400/20',
          glow: 'shadow-slate-500/5',
          indicator: 'bg-slate-500',
        };
    }
  };

  const activeOccupiedCount = tables.filter((t) => t.occupied).length;
  const readyCount = tables.filter((t) => t.status === orderService.OrderStatus.READY).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Restaurant Digital Twin</p>
          <h2 className="mt-2 text-3xl font-bold text-white tracking-wide">Table Operations</h2>
        </div>
        <button
          onClick={fetchOrdersAndBuildTwin}
          className="rounded-full bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 ring-1 ring-cyan-400/20 hover:bg-cyan-500/15 transition-all"
        >
          Refresh Live Twin
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && tables.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          
          {/* Grid View of Tables */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="rounded-3xl border border-white/5 bg-[#0c101c]/80 p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Active Tables</p>
                <p className="mt-2 text-3xl font-semibold text-white">{activeOccupiedCount}</p>
              </div>
              <div className="rounded-3xl border border-white/5 bg-[#0c101c]/80 p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Ready for Service</p>
                <p className="mt-2 text-3xl font-semibold text-green-400">{readyCount}</p>
              </div>
              <div className="rounded-3xl border border-white/5 bg-[#0c101c]/80 p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Total Tables</p>
                <p className="mt-2 text-3xl font-semibold text-cyan-300">20</p>
              </div>
            </div>

            {/* Grid layout for 20 tables */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 max-h-[500px] overflow-y-auto pr-2">
              {tables.map((table) => {
                const colors = getTableColor(table);
                const isActive = activeTable?.id === table.id;
                return (
                  <motion.button
                    key={table.id}
                    onClick={() => setActiveTable(table)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`rounded-3xl border p-4 text-left transition shadow-lg ${colors.glow} ${colors.bg} ${colors.border} ${
                      isActive ? 'ring-2 ring-cyan-400/55' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-white">{table.id}</p>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">{table.seats} seats</span>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider ${colors.badge}`}>
                        {table.status === 'PAID' ? 'PAID' : table.status === 'SENT_TO_KITCHEN' ? 'SENT' : table.status}
                      </span>
                      <span className={`h-2 w-2 rounded-full ${colors.indicator}`} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Table Details Sidebar (Right) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl h-fit"
          >
            {activeTable ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Table Detail</p>
                  <h2 className="mt-2 text-4xl font-bold text-white">{activeTable.id}</h2>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/5 bg-[#0c101c]/80 p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Occupancy</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {activeTable.occupied ? 'Occupied' : 'Available'}
                    </p>
                  </div>
                  
                  <div className="rounded-3xl border border-white/5 bg-[#0c101c]/80 p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Assigned Waiter</p>
                    <p className="mt-2 text-2xl font-semibold text-cyan-300">{activeTable.waiter}</p>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-[#0c101c]/80 p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Current order flow</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {activeTable.status === 'SENT_TO_KITCHEN' ? 'Sent To Kitchen' : activeTable.status}
                    </p>
                  </div>

                  {activeTable.orderId && (
                    <div className="rounded-3xl border border-white/5 bg-[#0c101c]/80 p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Order Value</p>
                      <p className="mt-2 text-2xl font-semibold text-emerald-400">
                        ₹{activeTable.totalAmount?.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {!activeTable.occupied ? (
                    <div className="grid gap-2">
                      <button
                        onClick={() => {
                          triggerLiveActivity('tableOccupied', { tableNumber: activeTable.number, seats: activeTable.seats });
                          setTables(prev => prev.map(t => t.id === activeTable.id ? { ...t, occupied: true, status: 'Occupied' } : t));
                          setActiveTable(prev => prev ? { ...prev, occupied: true, status: 'Occupied' } : null);
                        }}
                        className="w-full rounded-2xl bg-emerald-500 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                      >
                        Seat Guests (Simulate)
                      </button>
                      <button
                        onClick={() => navigate(`/waiter/orders/create?table=${activeTable.number}`)}
                        className="w-full rounded-2xl border border-cyan-400/20 bg-cyan-500/10 py-3 text-center text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/15"
                      >
                        Create Order
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {activeTable.orderId && (
                        <button
                          onClick={() => navigate(`/waiter/orders/${activeTable.orderId}`)}
                          className="w-full rounded-2xl bg-cyan-500 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                          Inspect Active Order
                        </button>
                      )}
                      <button
                        onClick={() => {
                          triggerLiveActivity('tableAvailable', { tableNumber: activeTable.number });
                          setTables(prev => prev.map(t => t.id === activeTable.id ? { ...t, occupied: false, status: 'Available', orderId: undefined, totalAmount: undefined } : t));
                          setActiveTable(prev => prev ? { ...prev, occupied: false, status: 'Available', orderId: undefined, totalAmount: undefined } : null);
                        }}
                        className="w-full rounded-2xl border border-red-500/35 bg-red-500/10 py-3 text-center text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                      >
                        Clear Table (Simulate)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500 text-sm">
                Select a table to inspect operations.
              </div>
            )}
          </motion.div>
        </section>
      )}
    </div>
  );
};

export default DigitalTwin;
