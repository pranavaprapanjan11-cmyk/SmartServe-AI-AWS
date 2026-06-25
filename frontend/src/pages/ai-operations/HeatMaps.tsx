// File: frontend/src/pages/ai-operations/HeatMaps.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { OperationalHeatmaps } from '../../services/aiOperationsService';

interface HeatMapsProps {
  heatmaps?: OperationalHeatmaps;
}

const HeatMaps: React.FC<HeatMapsProps> = ({ heatmaps }) => {
  if (!heatmaps) return null;

  const tables = heatmaps.tables || [];
  const hours = heatmaps.hours || [];

  // Table heat calculations
  const maxRevenue = Math.max(...tables.map((t) => t.revenue), 1);
  const maxUsage = Math.max(...tables.map((t) => t.usageCount), 1);

  // Time heat calculations
  const maxOrders = Math.max(...hours.map((h) => h.orderCount), 1);
  const maxTimeRevenue = Math.max(...hours.map((h) => h.revenue), 1);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Table Revenue Heatmap */}
      <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-xl">
        <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">Floor Seat utilization Heatmap</h3>
        <p className="mt-1.5 text-3xs text-slate-500">Visual occupancy and billing revenue per physical table</p>

        <div className="mt-6 grid grid-cols-4 sm:grid-cols-5 gap-3.5">
          {tables.map((t, idx) => {
            // Determine heat color intensity based on revenue ratio
            const ratio = t.revenue / maxRevenue;
            let bgColor = 'bg-slate-950/80 text-slate-500 border-white/5';
            
            if (ratio > 0.8) {
              bgColor = 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-lg shadow-cyan-500/5';
            } else if (ratio > 0.5) {
              bgColor = 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-lg shadow-emerald-500/5';
            } else if (ratio > 0.2) {
              bgColor = 'bg-indigo-500/15 text-indigo-200 border-indigo-500/30';
            } else if (t.usageCount > 0) {
              bgColor = 'bg-slate-800 text-slate-300 border-white/10';
            }

            return (
              <motion.div
                key={t.tableNumber}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.02 }}
                className={`rounded-2xl border p-3 flex flex-col items-center justify-center text-center ${bgColor}`}
              >
                <span className="text-sm font-extrabold">T{t.tableNumber}</span>
                <span className="text-[8px] text-slate-400 mt-1">₹{t.revenue.toFixed(0)}</span>
                <span className="text-[7px] text-slate-500 mt-0.5">{t.usageCount} orders</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hourly Load Heatmap */}
      <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-xl">
        <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">Hourly Operational Load</h3>
        <p className="mt-1.5 text-3xs text-slate-500">Order traffic density and total revenues hourly</p>

        <div className="mt-8 flex h-36 items-end justify-between gap-2.5">
          {hours.length === 0 ? (
            <div className="flex w-full h-full items-center justify-center text-xs text-slate-500">
              No hourly traffic recorded.
            </div>
          ) : (
            hours.map((h, idx) => {
              const heightPercent = Math.max(10, Math.round((h.orderCount / maxOrders) * 100));
              const revRatio = h.revenue / maxTimeRevenue;
              
              let barColor = 'bg-indigo-500/30';
              if (revRatio > 0.75) {
                barColor = 'bg-gradient-to-t from-cyan-500 to-sky-400';
              } else if (revRatio > 0.4) {
                barColor = 'bg-gradient-to-t from-emerald-500 to-teal-400';
              }

              return (
                <div key={h.hourLabel} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[7px] text-slate-400">₹{h.revenue.toFixed(0)}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.05 }}
                    className={`w-full rounded-t-lg ${barColor} relative group`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block rounded bg-slate-950 border border-white/10 px-2 py-1 text-[8px] text-white whitespace-nowrap z-10 shadow-lg">
                      Orders: {h.orderCount} | Avg Prep: {h.avgPrepTimeMinutes}m
                    </div>
                  </motion.div>
                  <span className="text-[8px] text-slate-500 font-bold whitespace-nowrap">{h.hourLabel}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default HeatMaps;
