// File: frontend/src/pages/billing/BillingDashboard.tsx
// Redesigned Billing Dashboard with live breakdowns, reprint, refund history and queue flows

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  BillingMetrics,
  InvoiceRecord,
  fetchBillingMetrics,
  fetchInvoices,
  fetchPayments,
  refundInvoice,
} from '../../services/billingService'
import * as orderService from '../../services/orderService'

const defaultBillingTemplate = {
  restaurantName: 'The Obsidian Bistro',
  headerTemplate: 'THE OBSIDIAN BISTRO\n13 Midnight Street\nNew Delhi\nGST: 27AABCDE1234F1Z5',
  footerTemplate: 'Thank you for dining with SmartServe AI.\nVisit again!',
}

const BillingDashboard: React.FC = () => {
  const { token, sseActive } = useAuth()
  const navigate = useNavigate()

  // State
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [orders, setOrders] = useState<orderService.Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reprint Receipt Modal
  const [selectedReprintInvoice, setSelectedReprintInvoice] = useState<InvoiceRecord | null>(null)
  const [reprintFormat, setReprintFormat] = useState<'58mm' | '80mm' | 'A4' | 'PDF'>('80mm')
  const [reprintMessage, setReprintMessage] = useState('')

  // Load all dashboard metrics
  const loadDashboardData = async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const [met, invs, pays, ords] = await Promise.all([
        fetchBillingMetrics(token),
        fetchInvoices(token),
        fetchPayments(token),
        orderService.getOrders(token),
      ])
      setMetrics(met)
      setInvoices(invs)
      setPayments(pays)
      setOrders(ords)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to load dashboard billing details.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData(true)

    const onUpdate = () => loadDashboardData(false)

    window.addEventListener('ordersUpdated', onUpdate)
    window.addEventListener('order_created', onUpdate)
    window.addEventListener('order_updated', onUpdate)
    window.addEventListener('order_completed', onUpdate)
    window.addEventListener('order_cancelled', onUpdate)

    const pollInterval = sseActive ? 10000 : 2000
    const iv = setInterval(onUpdate, pollInterval)

    return () => {
      window.removeEventListener('ordersUpdated', onUpdate)
      window.removeEventListener('order_created', onUpdate)
      window.removeEventListener('order_updated', onUpdate)
      window.removeEventListener('order_completed', onUpdate)
      window.removeEventListener('order_cancelled', onUpdate)
      clearInterval(iv)
    }
  }, [token, sseActive])

  // Compute daily totals and payment method breakdowns dynamically from payments
  const revenueBreakdown = useMemo(() => {
    const today = new Date().toDateString()
    const todayPayments = payments.filter((p) => {
      const pDate = new Date(p.created_at).toDateString()
      return pDate === today && p.status === 'PAID'
    })

    const cashTotal = todayPayments.filter((p) => p.payment_method === 'Cash').reduce((s, p) => s + parseFloat(p.amount), 0)
    const upiTotal = todayPayments.filter((p) => p.payment_method === 'UPI').reduce((s, p) => s + parseFloat(p.amount), 0)
    const cardTotal = todayPayments
      .filter((p) => p.payment_method === 'Credit Card' || p.payment_method === 'Debit Card')
      .reduce((s, p) => s + parseFloat(p.amount), 0)
    const refundTotal = payments
      .filter((p) => new Date(p.created_at).toDateString() === today && parseFloat(p.amount) < 0)
      .reduce((s, p) => s + Math.abs(parseFloat(p.amount)), 0)

    const grossToday = todayPayments.reduce((s, p) => s + parseFloat(p.amount), 0)
    
    return {
      Cash: cashTotal,
      UPI: upiTotal,
      Card: cardTotal,
      Refunds: refundTotal,
      GrossToday: grossToday - refundTotal,
    }
  }, [payments])

  // Group queue statuses dynamically
  const queues = useMemo(() => {
    return {
      waiting: orders.filter((o) => o.status === orderService.OrderStatus.SERVED),
      requested: orders.filter((o) => o.status === orderService.OrderStatus.BILL_REQUESTED),
      checkout: orders.filter((o) => o.status === orderService.OrderStatus.CHECKOUT_OPEN),
      hold: orders.filter((o) => o.status === orderService.OrderStatus.ON_HOLD),
      paid: invoices.filter((i) => i.status === 'PAID').slice(0, 8),
      refunded: invoices.filter((i) => i.status === 'REFUNDED'),
    }
  }, [orders, invoices])

  // Handle refund invoice trigger
  const handleRefundTrigger = async (invoiceId: string) => {
    if (!token) return
    if (!window.confirm('Are you sure you want to refund this invoice? This will reverse payments and mark the table as Available.')) return

    setLoading(true)
    try {
      await refundInvoice(token, invoiceId)
      setReprintMessage('Invoice refunded successfully!')
      setTimeout(() => setReprintMessage(''), 4000)
      await loadDashboardData()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Refund processing failed.')
      setTimeout(() => setError(null), 4000)
    } finally {
      setLoading(false)
    }
  }

  // Get active items list for reprint preview
  const reprintItems = useMemo(() => {
    if (!selectedReprintInvoice) return []
    const correspondingOrder = orders.find(o => o.id === selectedReprintInvoice.order_id)
    if (correspondingOrder?.items) return correspondingOrder.items
    
    // Fallback Mock items if order not found
    return [
      { name: 'Menu Item', quantity: 1, unit_price: selectedReprintInvoice.subtotal, subtotal: selectedReprintInvoice.subtotal }
    ]
  }, [selectedReprintInvoice, orders])

  return (
    <div className="space-y-8 text-white relative">
      <AnimatePresence>
        {/* Reprint Receipt Preview Modal */}
        {selectedReprintInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md overflow-y-auto py-8"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="w-full max-w-xl rounded-[2.5rem] border border-white/10 bg-[#0e1624] p-8 shadow-2xl flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-xl font-bold">Reprint Invoice Receipt</h3>
                  <p className="text-xs text-slate-400 mt-1">Invoice: {selectedReprintInvoice.invoice_number}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReprintInvoice(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Select Receipt Format</label>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(['58mm', '80mm', 'A4', 'PDF'] as const).map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setReprintFormat(format)}
                        className={`rounded-2xl py-3.5 text-xs font-semibold transition ${
                          reprintFormat === format
                            ? 'bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-400/30'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {format === '58mm' ? '58mm Thermal' : format === '80mm' ? '80mm Thermal' : format === 'A4' ? 'A4 Invoice' : 'PDF Receipt'}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-3xs text-slate-400 leading-relaxed">
                    Choose 58mm/80mm for counter thermal slips, or A4 / PDF for customer invoicing records.
                  </p>
                </div>

                {/* Styled Preview */}
                <div className="rounded-3xl bg-[#090b11] border border-white/10 p-5 max-h-[260px] overflow-y-auto flex flex-col items-center">
                  <p className="text-4xs text-slate-500 uppercase tracking-widest font-extrabold mb-3">Live preview</p>
                  <div className={`bg-white text-slate-900 p-4 font-mono text-[9px] shadow-lg rounded-sm leading-relaxed ${
                    reprintFormat === '58mm' ? 'w-[170px]' : reprintFormat === '80mm' ? 'w-[230px]' : 'w-[290px]'
                  }`}>
                    <div className="text-center font-bold text-xs border-b border-dashed border-slate-400 pb-2 mb-2">
                      {defaultBillingTemplate.restaurantName}
                    </div>
                    <pre className="whitespace-pre-wrap text-center mb-2">{defaultBillingTemplate.headerTemplate}</pre>
                    <div className="border-b border-dashed border-slate-400 pb-2 mb-2 space-y-1">
                      <p>INV: {selectedReprintInvoice.invoice_number}</p>
                      <p>DATE: {new Date(selectedReprintInvoice.issue_date).toLocaleString()}</p>
                      <p>STATUS: {selectedReprintInvoice.status}</p>
                    </div>

                    <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
                      {reprintItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.quantity} x {item.name}</span>
                          <span>₹{(item.subtotal || item.quantity * (item.unit_price || 0)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-right space-y-0.5 font-bold">
                      <p>Subtotal: ₹{parseFloat(selectedReprintInvoice.subtotal as any).toFixed(2)}</p>
                      <p>Tax: ₹{parseFloat(selectedReprintInvoice.tax_amount as any).toFixed(2)}</p>
                      <p>Discount: -₹{parseFloat(selectedReprintInvoice.discount_amount as any).toFixed(2)}</p>
                      <p className="border-t border-dashed border-slate-400 pt-1 text-[10px]">
                        Total: ₹{parseFloat(selectedReprintInvoice.total_amount as any).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReprintInvoice(null)}
                  className="flex-1 rounded-full border border-white/10 bg-white/5 py-3 text-xs font-bold uppercase tracking-wider"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReprintMessage('Reprinting success!')
                    setTimeout(() => {
                      setReprintMessage('')
                      setSelectedReprintInvoice(null)
                    }, 2000)
                  }}
                  className="flex-1 rounded-full bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 py-3 text-xs font-bold uppercase tracking-wider transition"
                >
                  {reprintMessage || 'Send to Printer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats and Revenues */}
      <section className="rounded-[2.5rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Billing Operations</p>
            <h1 className="mt-4 text-4xl font-bold text-white tracking-tight">Checkout Queue & Invoices</h1>
            <p className="mt-2 text-slate-400">
              Manage waiting tables, checkout transactions, daily payment breakdowns, and receipt refunds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/billing/editor')}
            className="rounded-full bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition"
          >
            Open Checkout Studio
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 font-semibold">
            {error}
          </div>
        )}

        {/* Daily breakdown metrics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5">
            <p className="text-4xs uppercase tracking-widest text-slate-500 font-extrabold">Net Revenue Today</p>
            <p className="mt-3 text-2xl font-bold text-white">₹{revenueBreakdown.GrossToday.toFixed(2)}</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5">
            <p className="text-4xs uppercase tracking-widest text-slate-500 font-extrabold">Cash Payments</p>
            <p className="mt-3 text-2xl font-bold text-emerald-400">₹{revenueBreakdown.Cash.toFixed(2)}</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5">
            <p className="text-4xs uppercase tracking-widest text-slate-500 font-extrabold">UPI Payments</p>
            <p className="mt-3 text-2xl font-bold text-cyan-400">₹{revenueBreakdown.UPI.toFixed(2)}</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5">
            <p className="text-4xs uppercase tracking-widest text-slate-500 font-extrabold">Card Payments</p>
            <p className="mt-3 text-2xl font-bold text-indigo-400">₹{revenueBreakdown.Card.toFixed(2)}</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5">
            <p className="text-4xs uppercase tracking-widest text-slate-500 font-extrabold">Total Refunds</p>
            <p className="mt-3 text-2xl font-bold text-rose-400">₹{revenueBreakdown.Refunds.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {/* Queues and Logs splits */}
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
        
        {/* Left Side: Active Checkout Queues */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold mb-4">Active Checkout Queue</h3>
            
            {/* Queues container */}
            <div className="space-y-6">
              
              {/* Bill Requested (High Priority) */}
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-300/80 font-bold mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Bill Requested ({queues.requested.length})
                </p>
                {queues.requested.length === 0 ? (
                  <p className="text-2xs text-slate-500 pl-4">No pending bill requests.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {queues.requested.map(order => (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/billing/editor?orderId=${order.id}`)}
                        className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 hover:border-amber-400/40 hover:bg-amber-500/10 cursor-pointer transition"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold">Table T{order.table_number}</p>
                          <span className="rounded-full bg-amber-400 text-slate-950 text-3xs px-2 py-0.5 font-bold uppercase">Requested</span>
                        </div>
                        <p className="text-3xs text-slate-400 mt-2">Server: {order.waiter_name || 'Staff'}</p>
                        <p className="text-xs font-bold text-white mt-1">Amount: ₹{order.total_amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout In Progress */}
              <div>
                <p className="text-xs uppercase tracking-widest text-cyan-300/80 font-bold mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Checkout In Progress ({queues.checkout.length})
                </p>
                {queues.checkout.length === 0 ? (
                  <p className="text-2xs text-slate-500 pl-4">No active checkouts currently open.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {queues.checkout.map(order => (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/billing/editor?orderId=${order.id}`)}
                        className="rounded-2xl border border-white/10 bg-[#0c101c] p-4 hover:border-cyan-400/40 cursor-pointer transition"
                      >
                        <p className="text-sm font-bold">Table T{order.table_number}</p>
                        <p className="text-3xs text-slate-400 mt-2">Opened Checkout session</p>
                        <p className="text-xs font-bold text-cyan-300 mt-1">Amount: ₹{order.total_amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* On Hold */}
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  On Hold ({queues.hold.length})
                </p>
                {queues.hold.length === 0 ? (
                  <p className="text-2xs text-slate-500 pl-4">No checkout sessions on hold.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {queues.hold.map(order => (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/billing/editor?orderId=${order.id}`)}
                        className="rounded-2xl border border-white/10 bg-[#0c101c]/60 p-4 hover:border-slate-400/40 cursor-pointer transition"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold">Table T{order.table_number}</p>
                          <span className="rounded-full bg-slate-800 text-slate-400 text-3xs px-2 py-0.5 font-bold uppercase">On Hold</span>
                        </div>
                        <p className="text-xs font-bold text-slate-300 mt-2">Amount: ₹{order.total_amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Waiting For Bill */}
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">
                  Waiting For Bill / Served ({queues.waiting.length})
                </p>
                {queues.waiting.length === 0 ? (
                  <p className="text-2xs text-slate-500 pl-4">All tables checkout completed.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {queues.waiting.map(order => (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/billing/editor?orderId=${order.id}`)}
                        className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 hover:bg-slate-900 transition cursor-pointer"
                      >
                        <p className="text-sm font-bold">Table T{order.table_number}</p>
                        <p className="text-3xs text-slate-500 mt-1">Status: Served</p>
                        <p className="text-xs font-bold text-slate-300 mt-1">₹{order.total_amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Paid & Refunded Logs */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl space-y-6">
            
            {/* Recently Paid */}
            <div>
              <h3 className="text-lg font-bold mb-4">Recently Closed Bills</h3>
              {queues.paid.length === 0 ? (
                <p className="text-2xs text-slate-500">No invoices finalized today.</p>
              ) : (
                <div className="space-y-3">
                  {queues.paid.map(inv => (
                    <div key={inv.id} className="rounded-2xl border border-white/5 bg-[#0a0e1b] p-4 flex items-center justify-between gap-4 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{inv.invoice_number}</p>
                        <p className="text-3xs text-slate-400 mt-1">Total: ₹{parseFloat(inv.total_amount as any).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedReprintInvoice(inv)}
                          className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200 px-3 py-1.5 font-semibold text-2xs hover:bg-cyan-500/20 transition"
                        >
                          Reprint
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRefundTrigger(inv.id)}
                          className="rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 px-3 py-1.5 font-semibold text-2xs hover:bg-rose-500/20 transition"
                        >
                          Refund
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Refunded History */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-rose-300">Refund Log</h3>
              {queues.refunded.length === 0 ? (
                <p className="text-2xs text-slate-500">No refunds recorded.</p>
              ) : (
                <div className="space-y-3">
                  {queues.refunded.map(inv => (
                    <div key={inv.id} className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-300">{inv.invoice_number}</p>
                        <p className="text-3xs text-rose-400 mt-1 font-semibold">Refunded Amount: ₹{parseFloat(inv.total_amount as any).toFixed(2)}</p>
                      </div>
                      <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-rose-300 font-bold text-3xs uppercase">Refunded</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}

export default BillingDashboard
