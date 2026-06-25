// File: frontend/src/pages/orders/OrderDetails.tsx
// Page to view order details and update its lifecycle status

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import * as orderService from '../../services/orderService';

const STATUS_SEQUENCE = [
  orderService.OrderStatus.NEW,
  orderService.OrderStatus.SENT_TO_KITCHEN,
  orderService.OrderStatus.PREPARING,
  orderService.OrderStatus.READY,
  orderService.OrderStatus.SERVED,
  orderService.OrderStatus.BILL_REQUESTED,
  orderService.OrderStatus.PAID,
];

const STATUS_LABELS: { [key in orderService.OrderStatus]: string } = {
  [orderService.OrderStatus.NEW]: 'New',
  [orderService.OrderStatus.SENT_TO_KITCHEN]: 'Sent to Kitchen',
  [orderService.OrderStatus.PREPARING]: 'Preparing',
  [orderService.OrderStatus.READY]: 'Ready',
  [orderService.OrderStatus.SERVED]: 'Served',
  [orderService.OrderStatus.BILL_REQUESTED]: 'Bill Requested',
  [orderService.OrderStatus.CHECKOUT_OPEN]: 'Checkout In Progress',
  [orderService.OrderStatus.ON_HOLD]: 'On Hold',
  [orderService.OrderStatus.PAID]: 'Paid',
  [orderService.OrderStatus.REFUNDED]: 'Refunded',
};

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, sseActive } = useAuth();
  
  const [order, setOrder] = useState<orderService.Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async (showLoading = true) => {
      if (!token || !id) return;
      try {
        if (showLoading) setLoading(true);
        const data = await orderService.getOrderById(id, token);
        setOrder(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load order:', err);
        setError('Failed to fetch order details. It might have been deleted.');
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchOrderDetails(true);

    const onUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.type === 'order_cancelled' && customEvent.detail?.id === id) {
        navigate('/waiter/dashboard');
        return;
      }
      if (customEvent.type === 'ordersUpdated' || !customEvent.detail || customEvent.detail.id === id) {
        fetchOrderDetails(false);
      }
    };

    window.addEventListener('ordersUpdated', onUpdate);
    window.addEventListener('order_created', onUpdate);
    window.addEventListener('order_updated', onUpdate);
    window.addEventListener('order_completed', onUpdate);
    window.addEventListener('order_cancelled', onUpdate);

    const pollInterval = sseActive ? 10000 : 2000;
    const iv = setInterval(() => fetchOrderDetails(false), pollInterval);

    return () => {
      window.removeEventListener('ordersUpdated', onUpdate);
      window.removeEventListener('order_created', onUpdate);
      window.removeEventListener('order_updated', onUpdate);
      window.removeEventListener('order_completed', onUpdate);
      window.removeEventListener('order_cancelled', onUpdate);
      clearInterval(iv);
    };
  }, [token, id, navigate, sseActive]);

  const handleUpdateStatus = async (newStatus: orderService.OrderStatus) => {
    if (!token || !id) return;
    try {
      setUpdating(true);
      setError(null);
      const updated = await orderService.updateOrderStatus(id, newStatus, token);
      setOrder(updated);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!token || !id) return;
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      setUpdating(true);
      setError(null);
      await orderService.deleteOrder(id, token);
      navigate('/waiter/dashboard');
    } catch (err: any) {
      console.error('Failed to delete order:', err);
      setError('Failed to delete order');
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-md p-6 text-center text-white">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
        <button
          onClick={() => navigate('/waiter/dashboard')}
          className="mt-6 rounded-2xl bg-cyan-500/10 px-6 py-2 border border-cyan-400/20 text-cyan-300"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!order) return null;

  const currentIdx = STATUS_SEQUENCE.indexOf(order.status);
  const nextStatus = currentIdx < STATUS_SEQUENCE.length - 1 ? STATUS_SEQUENCE[currentIdx + 1] : null;

  // Pricing helper
  const subtotal = order.total_amount;
  const tax = subtotal * 0.18;
  const grandTotal = subtotal + tax;

  const getStatusColorClass = (status: orderService.OrderStatus) => {
    switch (status) {
      case orderService.OrderStatus.NEW:
        return 'text-cyan-400 border-cyan-400/20 bg-cyan-500/10';
      case orderService.OrderStatus.SENT_TO_KITCHEN:
        return 'text-blue-400 border-blue-400/20 bg-blue-500/10';
      case orderService.OrderStatus.PREPARING:
        return 'text-amber-400 border-amber-400/20 bg-amber-500/10';
      case orderService.OrderStatus.READY:
        return 'text-emerald-400 border-emerald-400/20 bg-emerald-500/10';
      case orderService.OrderStatus.SERVED:
        return 'text-purple-400 border-purple-400/20 bg-purple-500/10';
      case orderService.OrderStatus.BILL_REQUESTED:
        return 'text-amber-400 border-amber-400/20 bg-amber-500/10';
      case orderService.OrderStatus.CHECKOUT_OPEN:
        return 'text-cyan-400 border-cyan-400/20 bg-cyan-500/10';
      case orderService.OrderStatus.ON_HOLD:
        return 'text-slate-400 border-slate-400/20 bg-slate-500/10';
      case orderService.OrderStatus.PAID:
        return 'text-emerald-400 border-emerald-400/20 bg-emerald-500/10';
      case orderService.OrderStatus.REFUNDED:
        return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-2 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button 
            type="button" 
            onClick={() => navigate('/waiter/dashboard')}
            className="text-sm text-cyan-400 hover:underline flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="mt-2 text-3xl font-bold tracking-wide">Table T{order.table_number} Order</h1>
          <p className="text-xs text-slate-400 mt-1">Order ID: {order.id}</p>
        </div>

        <div className="flex gap-3">
          {nextStatus && (
            <button
              onClick={() => handleUpdateStatus(nextStatus)}
              disabled={updating}
              className="rounded-2xl bg-cyan-500 px-6 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              Advance to: {STATUS_LABELS[nextStatus]}
            </button>
          )}
          <button
            onClick={handleDeleteOrder}
            disabled={updating}
            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        
        {/* Left Panel: Order details and status timeline */}
        <div className="space-y-6">
          
          {/* Order Summary Info */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl space-y-4">
            <h2 className="text-lg font-semibold text-cyan-300">Order Properties</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                <p className="text-xs text-slate-400">Guest Count</p>
                <p className="text-2xl font-bold mt-1 text-white">{order.guest_count} guests</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                <p className="text-xs text-slate-400">Assigned Waiter</p>
                <p className="text-2xl font-bold mt-1 text-cyan-300">{order.waiter_name || 'Waiter'}</p>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-cyan-300 mb-6">Status Timeline</h2>
            
            {/* Horizontal timeline */}
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2 pl-4 md:pl-0">
              
              {/* Vertical line (mobile) or Horizontal line (desktop) */}
              <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-white/10 md:left-4 md:right-4 md:top-[18px] md:h-0.5 md:w-auto md:bottom-auto" />
              
              {STATUS_SEQUENCE.map((status, index) => {
                const isActive = index <= currentIdx;
                const isCurrent = index === currentIdx;

                return (
                  <div key={status} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2.5">
                    {/* Circle Node */}
                    <button
                      onClick={() => handleUpdateStatus(status)}
                      disabled={updating}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                        isCurrent
                          ? 'border-cyan-400 bg-cyan-400 text-slate-950 font-bold scale-110 shadow-lg shadow-cyan-400/30'
                          : isActive
                          ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                          : 'border-white/20 bg-slate-900 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </button>

                    {/* Label */}
                    <div className="text-left md:text-center">
                      <p className={`text-xs font-semibold ${isCurrent ? 'text-white' : isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        {STATUS_LABELS[status]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Panel: Items Cart Summary */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl h-fit flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-xl font-bold text-white">Items Ordered</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${getStatusColorClass(order.status)}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            
            {/* Items List */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-0.5">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      ₹{item.unit_price} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    ₹{item.subtotal}
                  </span>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No items listed.
                </div>
              )}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-white/10 pt-4 space-y-2 text-sm text-slate-400">
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
              <span className="text-cyan-300">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderDetails;
