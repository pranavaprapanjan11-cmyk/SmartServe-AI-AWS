// File: frontend/src/pages/ai-operations/RealTimeWall.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { RealTimeOperationsWall } from '../../services/aiOperationsService';

interface RealTimeWallProps {
  wall?: RealTimeOperationsWall;
}

const RealTimeWall: React.FC<RealTimeWallProps> = ({ wall }) => {
  if (!wall) return null;

  const metrics = [
    {
      label: 'Tables Occupied',
      value: wall.tablesOccupied,
      icon: '🔴',
      textColor: 'text-rose-400',
      glow: 'shadow-rose-500/10 border-rose-500/10 bg-rose-500/5',
    },
    {
      label: 'Tables Available',
      value: wall.tablesAvailable,
      icon: '🟢',
      textColor: 'text-emerald-400',
      glow: 'shadow-emerald-500/10 border-emerald-500/10 bg-emerald-500/5',
    },
    {
      label: 'Tables Cleaning',
      value: wall.tablesCleaning,
      icon: '🔵',
      textColor: 'text-cyan-400',
      glow: 'shadow-cyan-500/10 border-cyan-500/10 bg-cyan-500/5',
    },
    {
      label: 'Active Orders',
      value: wall.ordersActive,
      icon: '⚡',
      textColor: 'text-sky-400',
      glow: 'shadow-sky-500/10 border-sky-500/10 bg-sky-500/5',
    },
    {
      label: 'Delayed Orders',
      value: wall.ordersDelayed,
      icon: '⚠️',
      textColor: wall.ordersDelayed > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400',
      glow: wall.ordersDelayed > 0 ? 'shadow-amber-500/20 border-amber-500/20 bg-amber-500/10' : 'border-white/5 bg-slate-950/40',
    },
    {
      label: 'Kitchen Load',
      value: `${wall.kitchenLoadPercent}%`,
      icon: '👨‍🍳',
      textColor: wall.kitchenLoadPercent >= 80 ? 'text-rose-400' : 'text-purple-400',
      glow: wall.kitchenLoadPercent >= 80 ? 'shadow-rose-500/20 border-rose-500/20 bg-rose-500/10' : 'border-white/5 bg-slate-950/40',
    },
    {
      label: 'Pending Bills',
      value: wall.pendingBills,
      icon: '🧾',
      textColor: 'text-amber-300',
      glow: 'shadow-amber-500/10 border-amber-500/10 bg-amber-500/5',
    },
    {
      label: 'Revenue Today',
      value: `₹${wall.revenueToday.toFixed(0)}`,
      icon: '💰',
      textColor: 'text-emerald-400 font-extrabold',
      glow: 'shadow-emerald-500/15 border-emerald-500/20 bg-emerald-500/10',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {metrics.map((m, idx) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
          className={`rounded-3xl border p-5 shadow-lg backdrop-blur-xl transition hover:scale-[1.02] ${m.glow}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-3xs uppercase tracking-widest text-slate-400 font-bold">{m.label}</span>
            <span className="text-base">{m.icon}</span>
          </div>
          <p className={`mt-3 text-2xl font-semibold tracking-tight ${m.textColor}`}>
            {m.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default RealTimeWall;
