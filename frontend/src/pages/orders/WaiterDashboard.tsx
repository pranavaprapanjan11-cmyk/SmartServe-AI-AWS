// File: frontend/src/pages/orders/WaiterDashboard.tsx
// Mobile-first dashboard for waiters to select tables and view order statuses

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import * as orderService from '../../services/orderService';

type TableStatus = 'Available' | 'Occupied' | 'Preparing' | 'Ready';

interface Table {
  number: number;
  status: TableStatus;
  orderId?: string;
  guestCount?: number;
  totalAmount?: number;
}

const WaiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token, sseActive } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrdersAndBuildTables = async (showLoading = true) => {
      if (!token) return;
      try {
        if (showLoading) setLoading(true);
        const orders = await orderService.getOrders(token);

        // Find the latest active order for each table
        // Active orders are those that are NOT PAID
        const activeOrdersByTable: { [key: number]: orderService.Order } = {};
        orders.forEach((order) => {
          if (order.status !== orderService.OrderStatus.PAID) {
            // Keep the latest order if multiple exist
            if (!activeOrdersByTable[order.table_number] || 
                new Date(order.created_at) > new Date(activeOrdersByTable[order.table_number].created_at)) {
              activeOrdersByTable[order.table_number] = order;
            }
          }
        });

        // Generate tables 1 to 20
        const tableList: Table[] = Array.from({ length: 20 }, (_, idx) => {
          const tableNum = idx + 1;
          const activeOrder = activeOrdersByTable[tableNum];

          let status: TableStatus = 'Available';
          if (activeOrder) {
            if (activeOrder.status === orderService.OrderStatus.NEW || 
                activeOrder.status === orderService.OrderStatus.SENT_TO_KITCHEN) {
              status = 'Occupied';
            } else if (activeOrder.status === orderService.OrderStatus.PREPARING) {
              status = 'Preparing';
            } else if (activeOrder.status === orderService.OrderStatus.READY || 
                       activeOrder.status === orderService.OrderStatus.SERVED) {
              status = 'Ready';
            }
          }

          return {
            number: tableNum,
            status,
            orderId: activeOrder?.id,
            guestCount: activeOrder?.guest_count,
            totalAmount: activeOrder?.total_amount,
          };
        });

        setTables(tableList);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError('Failed to load table statuses');
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchOrdersAndBuildTables(true);

    const onUpdate = () => fetchOrdersAndBuildTables(false);

    window.addEventListener('ordersUpdated', onUpdate);
    window.addEventListener('order_created', onUpdate);
    window.addEventListener('order_updated', onUpdate);
    window.addEventListener('order_completed', onUpdate);
    window.addEventListener('order_cancelled', onUpdate);

    const pollInterval = sseActive ? 10000 : 2000;
    const iv = setInterval(() => fetchOrdersAndBuildTables(false), pollInterval);

    return () => {
      window.removeEventListener('ordersUpdated', onUpdate);
      window.removeEventListener('order_created', onUpdate);
      window.removeEventListener('order_updated', onUpdate);
      window.removeEventListener('order_completed', onUpdate);
      window.removeEventListener('order_cancelled', onUpdate);
      clearInterval(iv);
    };
  }, [token, sseActive]);

  const handleTableClick = (table: Table) => {
    if (table.orderId) {
      navigate(`/waiter/orders/${table.orderId}`);
    } else {
      navigate(`/waiter/orders/create?table=${table.number}`);
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'Available':
        return {
          bg: 'bg-slate-900/50',
          border: 'border-white/10',
          text: 'text-slate-400',
          glow: 'shadow-slate-500/5',
          dot: 'bg-slate-500',
        };
      case 'Occupied': // NEW / SENT_TO_KITCHEN (Cyan)
        return {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-400/20',
          text: 'text-cyan-300',
          glow: 'shadow-cyan-500/10',
          dot: 'bg-cyan-400 animate-pulse',
        };
      case 'Preparing': // PREPARING (Amber)
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-400/20',
          text: 'text-amber-300',
          glow: 'shadow-amber-500/10',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'Ready': // READY / SERVED (Green/Emerald)
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-400/20',
          text: 'text-emerald-300',
          glow: 'shadow-emerald-500/10',
          dot: 'bg-emerald-400 animate-bounce',
        };
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-2">
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Service Flow</p>
        <h1 className="mt-2 text-3xl font-bold text-white tracking-wide">Waiter Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Select a table to start an order or view status</p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        >
          {tables.map((table) => {
            const colors = getStatusColor(table.status);
            return (
              <motion.button
                key={table.number}
                onClick={() => handleTableClick(table)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex flex-col justify-between rounded-3xl border p-4 text-left shadow-lg transition backdrop-blur-xl ${colors.bg} ${colors.border} ${colors.glow}`}
              >
                <div className="flex items-start justify-between w-full">
                  <span className="text-2xl font-bold text-white">T{table.number}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                </div>

                <div className="mt-6">
                  <span className={`text-xs uppercase tracking-wider font-semibold ${colors.text}`}>
                    {table.status}
                  </span>
                  {table.orderId && (
                    <div className="mt-2 space-y-0.5 text-xs text-slate-400">
                      <p>{table.guestCount} guests</p>
                      <p className="font-semibold text-white">₹{table.totalAmount?.toFixed(0)}</p>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-8 flex justify-center gap-4 rounded-3xl border border-white/5 bg-slate-950/40 p-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span>Preparing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
};

export default WaiterDashboard;
