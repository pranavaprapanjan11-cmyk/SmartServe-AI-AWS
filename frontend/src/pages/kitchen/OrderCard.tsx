import React from 'react';
import { motion } from 'framer-motion';
import * as orderService from '../../services/orderService';

type Props = {
  order: orderService.Order;
  onAction: (order: orderService.Order) => void;
  onRemake: (orderId: string, itemId: string, reason: string) => void;
  columnType: 'NEW' | 'COOKING' | 'READY';
  isNew?: boolean;
};

const OrderCard: React.FC<Props> = ({ order, onAction, onRemake, columnType, isNew }) => {
  // Format the creation time to local time (e.g. "12:35 PM")
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Get accent class names based on column status
  const getAccentConfig = () => {
    switch (columnType) {
      case 'NEW':
        return {
          glow: 'shadow-[0_0_15px_rgba(56,189,248,0.05)] border-sky-500/20 hover:border-sky-500/40',
          badge: 'bg-sky-500/10 text-sky-300 ring-sky-400/20',
          button: 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold',
          line: 'bg-sky-500/40',
          labelText: 'Start Cooking',
        };
      case 'COOKING':
        return {
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.05)] border-amber-500/20 hover:border-amber-500/40',
          badge: 'bg-amber-500/10 text-amber-300 ring-amber-400/20',
          button: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold',
          line: 'bg-amber-500/40',
          labelText: 'Mark Ready',
        };
      case 'READY':
        return {
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.05)] border-emerald-500/20 hover:border-emerald-500/40',
          badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
          button: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold',
          line: 'bg-emerald-500/40',
          labelText: 'Mark Served',
        };
    }
  };

  const config = getAccentConfig();
  const shortId = order.id.split('-')[0].toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isNew ? {
        opacity: 1,
        scale: 1,
        borderColor: ["rgba(56, 189, 248, 0.2)", "rgba(56, 189, 248, 0.9)", "rgba(56, 189, 248, 0.2)"],
        boxShadow: [
          "0 0 15px rgba(56,189,248,0.05)",
          "0 0 25px rgba(56,189,248,0.35)",
          "0 0 15px rgba(56,189,248,0.05)"
        ],
        transition: {
          repeat: Infinity,
          duration: 1.5
        }
      } : { opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-3xl border bg-white/[0.02] backdrop-blur-md p-5 ${config.glow} transition-colors duration-300`}
    >
      {/* Accent Line Indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${config.line}`} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Order ID</span>
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            #{shortId}
            {isNew && (
              <span className="inline-flex items-center rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-xs font-bold text-cyan-300 animate-pulse ring-1 ring-cyan-400/30">
                NEW
              </span>
            )}
          </h4>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${config.badge}`}>
            {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
        {order.items && order.items.length > 0 ? (
          order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-300 line-clamp-2">
                {item.name || 'Unknown Item'}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white whitespace-nowrap">
                  x{item.quantity}
                </span>
                {(columnType === 'COOKING' || columnType === 'READY') && (
                  <button
                    type="button"
                    onClick={() => {
                      const reason = window.prompt(`Enter wastage reason for remaking "${item.name}":`);
                      if (reason && reason.trim()) {
                        onRemake(order.id, item.id, reason.trim());
                      }
                    }}
                    className="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-300 hover:bg-red-500/20 transition active:scale-95"
                  >
                    Remake
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs italic text-slate-500">No items specified</div>
        )}
      </div>

      {/* Footer / Total & Time */}
      <div className="mt-5 border-t border-white/5 pt-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Time Ordered</span>
          <span className="text-sm font-semibold text-slate-300">{formatTime(order.created_at)}</span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Total Amount</span>
          <span className="text-base font-extrabold text-white">₹{Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onAction(order)}
        className={`mt-5 w-full rounded-2xl py-3 px-4 text-sm tracking-wide transition-all duration-300 active:scale-[0.98] ${config.button}`}
      >
        {config.labelText}
      </button>
    </motion.div>
  );
};

export default OrderCard;
