// File: frontend/src/pages/ai-operations/ActivityTimeline.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityEvent } from '../../services/aiOperationsService';

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events }) => {
  const getEventAnimationDetails = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED':
      case 'WAITER_ASSIGNED':
        return {
          icon: '🚶👔',
          badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
          animate: { x: [-10, 10, 0] },
          transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
        };
      case 'ORDER_PREPARING':
      case 'CHEF_STARTED_ORDER':
        return {
          icon: '👨‍🍳🔥',
          badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          animate: { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] },
          transition: { repeat: Infinity, duration: 1.5 },
        };
      case 'ORDER_READY':
      case 'CHEF_COMPLETED_ORDER':
        return {
          icon: '🛎️🍕',
          badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          animate: { y: [0, -5, 0] },
          transition: { repeat: Infinity, duration: 1 },
        };
      case 'ORDER_SERVED':
      case 'STOCK_REDUCED':
      case 'WAITER_COMPLETED_SERVICE':
        return {
          icon: '🍽️',
          badgeClass: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
          animate: { x: [0, 15, 0] },
          transition: { duration: 1.5, repeat: Infinity },
        };
      case 'BILL_REQUESTED':
      case 'INVOICE_GENERATED':
        return {
          icon: '🧾💵',
          badgeClass: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
          animate: { skewX: [0, 10, -10, 0] },
          transition: { repeat: Infinity, duration: 2 },
        };
      case 'PAYMENT_COMPLETED':
      case 'PAYMENT_RECEIVED':
      case 'SPLIT_PAYMENT':
        return {
          icon: '💸💰',
          badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          animate: { rotateY: [0, 180, 360] },
          transition: { duration: 2, repeat: Infinity },
        };
      case 'TABLE_CLEANING':
        return {
          icon: '🧹🧼',
          badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
          animate: { rotate: [0, 360] },
          transition: { repeat: Infinity, duration: 2.5, ease: 'linear' },
        };
      case 'TABLE_AVAILABLE':
        return {
          icon: '🟢',
          badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          animate: { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] },
          transition: { duration: 2, repeat: Infinity },
        };
      case 'LOW_STOCK':
      case 'alert-out':
        return {
          icon: '⚠️📦',
          badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          animate: { scale: [1, 1.1, 1] },
          transition: { duration: 1, repeat: Infinity },
        };
      default:
        return {
          icon: '📢',
          badgeClass: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
          animate: {},
          transition: {},
        };
    }
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-xl flex flex-col h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">Restaurant Activity Timeline</h3>
        <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-3xs font-semibold text-cyan-200 ring-1 ring-cyan-400/20">
          Live stream
        </span>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto pr-2 max-h-[480px] custom-scrollbar space-y-4">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-slate-500">
              No recent activity events logged.
            </div>
          ) : (
            events.map((event) => {
              const details = getEventAnimationDetails(event.event_type);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="relative flex gap-4 rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:bg-slate-950/60"
                >
                  {/* Event Icon with Framer Motion Animation */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-white/5 relative">
                    <motion.span
                      animate={details.animate}
                      transition={details.transition as any}
                      className="text-lg"
                    >
                      {details.icon}
                    </motion.span>
                  </div>

                  {/* Event text and timestamp */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${details.badgeClass}`}>
                        {event.event_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-200 leading-relaxed">
                      {event.description}
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

export default ActivityTimeline;
