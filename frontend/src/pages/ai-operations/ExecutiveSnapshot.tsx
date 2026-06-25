// File: frontend/src/pages/ai-operations/ExecutiveSnapshot.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ExecutiveSnapshot as SnapshotModel } from '../../services/aiOperationsService';

interface ExecutiveSnapshotProps {
  snapshot?: SnapshotModel;
}

const ExecutiveSnapshot: React.FC<ExecutiveSnapshotProps> = ({ snapshot }) => {
  if (!snapshot) return null;

  const cards = [
    { label: 'Revenue Today', value: `₹${snapshot.revenueToday.toLocaleString()}`, icon: '💰', color: 'text-emerald-400' },
    { label: 'Orders Handled', value: snapshot.ordersToday, icon: '⚡', color: 'text-sky-400' },
    { label: 'Guests Served', value: snapshot.guestsServed, icon: '👥', color: 'text-indigo-400' },
    { label: 'Table Utilization', value: `${snapshot.tableUtilizationPercent}%`, icon: '🪑', color: 'text-cyan-400' },
    { label: 'Inventory Alerts', value: snapshot.inventoryAlertsCount, icon: '📦', color: snapshot.inventoryAlertsCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400' },
    { label: 'Refunds processed', value: `₹${snapshot.refundsTodayAmount.toFixed(0)}`, icon: '↩️', color: snapshot.refundsTodayCount > 0 ? 'text-rose-400' : 'text-slate-400' },
  ];

  const summaries = [
    { label: 'Best Performing Waiter', value: snapshot.summary.bestPerformingWaiter, desc: 'Highest billing value served today' },
    { label: 'Busiest Table Card', value: `Table ${snapshot.summary.bestPerformingTable}`, desc: 'Floor seat with highest turnover revenue' },
    { label: 'Most Popular Menu Item', value: snapshot.summary.mostPopularMenuItem, desc: 'Highest sales volume item today' },
    { label: 'Highest Revenue Category', value: snapshot.summary.highestRevenueCategory, desc: 'Most profitable menu department today' },
  ];

  return (
    <div className="space-y-6">
      {/* Today's Snapshot */}
      <div>
        <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">Today's Executive Snapshot</h3>
        <div className="mt-4 grid gap-4 grid-cols-2 lg:grid-cols-6">
          {cards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 relative"
            >
              <span className="absolute top-4 right-4 text-xs">{card.icon}</span>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{card.label}</p>
              <p className={`mt-2.5 text-xl font-bold tracking-tight ${card.color}`}>
                {card.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Operational Summary */}
      <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-xl">
        <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">Operational Performance Summary</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaries.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="rounded-2xl border border-white/5 bg-slate-950/50 p-4"
            >
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{s.label}</p>
              <p className="mt-2 text-base font-extrabold text-white truncate">{s.value}</p>
              <p className="mt-1 text-[10px] text-slate-500">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSnapshot;
