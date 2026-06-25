// File: frontend/src/pages/ai-operations/AlertCenter.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PriorityAlert } from '../../services/aiOperationsService';

interface AlertCenterProps {
  alerts: PriorityAlert[];
}

const AlertCenter: React.FC<AlertCenterProps> = ({ alerts }) => {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          card: 'border-rose-500/20 bg-rose-500/5 shadow-rose-500/5',
          tag: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          dot: 'bg-rose-500 shadow-rose-500/50',
          indicator: '⚡ CRITICAL',
        };
      case 'WARNING':
        return {
          card: 'border-amber-500/20 bg-amber-500/5 shadow-amber-500/5',
          tag: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          dot: 'bg-amber-500 shadow-amber-500/50',
          indicator: '⚠️ WARNING',
        };
      default:
        return {
          card: 'border-cyan-500/20 bg-cyan-500/5 shadow-cyan-500/5',
          tag: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
          dot: 'bg-cyan-400 shadow-cyan-400/50',
          indicator: 'ℹ️ INFO',
        };
    }
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-xl flex flex-col h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">Alert Control Center</h3>
        <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-3xs font-semibold text-rose-300 ring-1 ring-rose-400/20">
          {alerts.length} Active Alarms
        </span>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto pr-1 max-h-[380px] custom-scrollbar space-y-3">
        <AnimatePresence initial={false}>
          {alerts.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-slate-500">
              No active operational alerts.
            </div>
          ) : (
            alerts.map((alert) => {
              const styles = getSeverityStyle(alert.severity);
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl border p-4 shadow-lg backdrop-blur-xl ${styles.card} flex gap-4`}
                >
                  {/* Status Dot with pulse */}
                  <div className="relative mt-1 flex h-2 w-2 items-center justify-center shrink-0">
                    <span className={`absolute h-3.5 w-3.5 rounded-full animate-ping opacity-35 ${styles.dot}`} />
                    <span className={`relative h-2 w-2 rounded-full ${styles.dot}`} />
                  </div>

                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${styles.tag}`}>
                        {styles.indicator} - {alert.category}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-200 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertCenter;
