// File: frontend/src/pages/billing/BillingEditor.tsx
// Complete production-ready Restaurant Checkout & Receipt Printing system

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  BillingTemplateModel,
  DiscountSettingsModel,
  PaymentMethodType,
} from '../../types/foundation'
import {
  BillableOrder,
  InvoiceRecord,
  createInvoice,
  fetchBillableOrders,
  fetchInvoiceByOrder,
  submitPayment,
  fetchPayments,
  validateManagerPin,
} from '../../services/billingService'
import * as orderService from '../../services/orderService'
import * as menuService from '../../services/menuService'
import * as settingsService from '../../services/settingsService'
import { triggerLiveActivity } from '../../utils/activityTrigger'

const defaultBillingTemplate: BillingTemplateModel = {
  restaurantName: 'The Obsidian Bistro',
  headerTemplate: 'THE OBSIDIAN BISTRO\n13 Midnight Street\nNew Delhi\nGST: 27AABCDE1234F1Z5',
  footerTemplate: 'Thank you for dining with SmartServe AI.\nVisit again!',
}

const BillingEditor: React.FC = () => {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryOrderId = searchParams.get('orderId') || ''

  // State
  const [orders, setOrders] = useState<BillableOrder[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>(queryOrderId)
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<menuService.MenuItem[]>([])
  const [printers, setPrinters] = useState<any[]>([])
  
  // UI states
  const [loading, setLoading] = useState(false)
  const [billMessage, setBillMessage] = useState<string>('')
  
  // Edit items mode
  const [isEditingItems, setIsEditingItems] = useState(false)
  const [editingItemsList, setEditingItemsList] = useState<{ menu_item_id: string; name: string; quantity: number; price: number }[]>([])
  const [selectedAddItem, setSelectedAddItem] = useState<string>('')
  const [addQty, setAddQty] = useState(1)

  // Charges
  const [gstPercent, setGstPercent] = useState<number>(18)
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(10)
  const [packingCharge, setPackingCharge] = useState<number>(0)
  const [applyServiceCharge, setApplyServiceCharge] = useState(true)
  const [applyPackingCharge, setApplyPackingCharge] = useState(false)

  // Discount
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountPercentValue, setDiscountPercentValue] = useState<number>(0)
  const [discountFixedValue, setDiscountFixedValue] = useState<number>(0)
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0)

  // Manager Approval Modal
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [managerPin, setManagerPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pendingDiscountValue, setPendingDiscountValue] = useState<{ type: 'percent' | 'fixed'; val: number } | null>(null)

  // Payment splits
  const [paymentMode, setPaymentMode] = useState<'full' | 'equal' | 'custom'>('full')
  const [guestSplits, setGuestSplits] = useState<number>(2)
  const [customPayAmount, setCustomPayAmount] = useState<string>('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('Cash')
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  // Receipt format & Printer preview
  const [receiptFormat, setReceiptFormat] = useState<'58mm' | '80mm' | 'A4' | 'PDF'>('80mm')
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printerError, setPrinterError] = useState<string | null>(null)

  // Load orders and menu items
  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) return
      try {
        const [billable, menuData, printerSettings] = await Promise.all([
          fetchBillableOrders(token),
          menuService.getMenuItems(token),
          settingsService.fetchPrinterSettings(token),
        ])
        setOrders(billable)
        setMenuItems(menuData)
        setPrinters(printerSettings)

        // Select order if passed in query
        if (queryOrderId) {
          setSelectedOrderId(queryOrderId)
        } else if (billable.length > 0) {
          setSelectedOrderId(billable[0].id)
        }
      } catch (err) {
        console.error('Failed to load initial checkout data', err)
      }
    }
    loadInitialData()
  }, [token, queryOrderId])

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId),
    [orders, selectedOrderId]
  )

  // Transition status to CHECKOUT_OPEN when selected
  useEffect(() => {
    const openCheckout = async () => {
      if (!token || !selectedOrder) return
      if (selectedOrder.status === 'BILL_REQUESTED' || selectedOrder.status === 'ON_HOLD' || selectedOrder.status === 'SERVED') {
        try {
          await orderService.updateOrderStatus(selectedOrder.id, 'CHECKOUT_OPEN' as any, token)
          selectedOrder.status = 'CHECKOUT_OPEN'
        } catch (err) {
          console.error('Failed to update status to CHECKOUT_OPEN', err)
        }
      }
    }
    openCheckout()
  }, [selectedOrder, token])

  // Load invoice and payments
  const loadInvoiceAndPayments = async () => {
    if (!token || !selectedOrder) {
      setInvoice(null)
      setPayments([])
      return
    }
    try {
      const existingInvoice = await fetchInvoiceByOrder(token, selectedOrder.id)
      setInvoice(existingInvoice)

      const allPayments = await fetchPayments(token)
      const filtered = allPayments.filter((p) => p.invoice_id === existingInvoice.id)
      setPayments(filtered)
    } catch (err) {
      setInvoice(null)
      setPayments([])
    }
  }

  useEffect(() => {
    loadInvoiceAndPayments()
  }, [selectedOrder, token])

  // Order items helper
  const displayOrderItems = useMemo(() => {
    if (selectedOrder?.items?.length) {
      return selectedOrder.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
      }))
    }
    return []
  }, [selectedOrder])

  const subtotal = useMemo(
    () => displayOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [displayOrderItems]
  )

  // Taxes, Packaging, Service Charge and Grand Total Calculations
  const calculatedGst = useMemo(() => (subtotal * gstPercent) / 100, [subtotal, gstPercent])
  const calculatedServiceCharge = useMemo(
    () => (applyServiceCharge ? (subtotal * serviceChargePercent) / 100 : 0),
    [subtotal, applyServiceCharge, serviceChargePercent]
  )
  const calculatedPacking = useMemo(() => (applyPackingCharge ? packingCharge : 0), [applyPackingCharge, packingCharge])

  const preDiscountTotal = useMemo(
    () => subtotal + calculatedGst + calculatedServiceCharge + calculatedPacking,
    [subtotal, calculatedGst, calculatedServiceCharge, calculatedPacking]
  )

  const grandTotal = useMemo(
    () => parseFloat(Math.max(0, preDiscountTotal - appliedDiscount).toFixed(2)),
    [preDiscountTotal, appliedDiscount]
  )

  // Total paid and outstanding
  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    [payments]
  )

  const unpaidBalance = useMemo(
    () => parseFloat(Math.max(0, (invoice ? invoice.total_amount : grandTotal) - totalPaid).toFixed(2)),
    [invoice, grandTotal, totalPaid]
  )

  // Pre-fill payment amount
  useEffect(() => {
    if (paymentMode === 'full') {
      setCustomPayAmount(unpaidBalance.toString())
    } else if (paymentMode === 'equal') {
      const share = parseFloat((unpaidBalance / guestSplits).toFixed(2))
      setCustomPayAmount(share.toString())
    }
  }, [unpaidBalance, paymentMode, guestSplits])

  // Discount Trigger with PIN authorization check
  const handleApplyDiscount = () => {
    let discAmount = 0
    let requiresApproval = false

    if (discountType === 'percent') {
      discAmount = (preDiscountTotal * discountPercentValue) / 100
      if (discountPercentValue > 15 || discAmount > 500) {
        requiresApproval = true
      }
    } else {
      discAmount = discountFixedValue
      if (discountFixedValue > 500) {
        requiresApproval = true
      }
    }

    if (requiresApproval) {
      setPendingDiscountValue({ type: discountType, val: discountType === 'percent' ? discountPercentValue : discountFixedValue })
      setShowManagerModal(true)
      setPinError(null)
      setManagerPin('')
    } else {
      setAppliedDiscount(parseFloat(discAmount.toFixed(2)))
      setBillMessage('Discount applied successfully.')
      setTimeout(() => setBillMessage(''), 3000)
    }
  }

  const submitPinApproval = async () => {
    if (!token || !pendingDiscountValue) return
    setLoading(true)
    setPinError(null)
    try {
      const result = await validateManagerPin(managerPin, token)
      if (result.approved) {
        let discAmount = 0
        if (pendingDiscountValue.type === 'percent') {
          discAmount = (preDiscountTotal * pendingDiscountValue.val) / 100
        } else {
          discAmount = pendingDiscountValue.val
        }
        setAppliedDiscount(parseFloat(discAmount.toFixed(2)))
        setShowManagerModal(false)
        setPendingDiscountValue(null)
        setBillMessage(`Discount approved by Manager ${result.managerName || ''}`)
        setTimeout(() => setBillMessage(''), 5000)
      } else {
        setPinError('Incorrect Manager PIN')
      }
    } catch (err: any) {
      setPinError(err?.response?.data?.message || 'Authorization failed.')
    } finally {
      setLoading(false)
    }
  }

  // Invoice creation
  const handleGenerateBill = async () => {
    if (!token || !selectedOrderId) return
    setLoading(true)
    try {
      const created = await createInvoice(token, {
        order_id: selectedOrderId,
        tax_percent: gstPercent,
        discount_amount: appliedDiscount,
      })
      setInvoice(created)
      setBillMessage(`Invoice ${created.invoice_number} generated. Proceed to payment.`)
      setTimeout(() => setBillMessage(''), 4000)
    } catch (err: any) {
      setBillMessage(err?.response?.data?.message || 'Invoice generation failed.')
      setTimeout(() => setBillMessage(''), 4000)
    } finally {
      setLoading(false)
    }
  }

  // Submit payment
  const handlePay = async () => {
    if (!token || !invoice) return
    const payVal = parseFloat(customPayAmount)
    if (isNaN(payVal) || payVal <= 0 || payVal > unpaidBalance + 0.05) {
      setBillMessage('Please enter a valid payment amount.')
      return
    }

    setPaymentProcessing(true)
    try {
      const isFinalPayment = payVal >= unpaidBalance - 0.05
      await submitPayment(token, {
        invoice_id: invoice.id,
        amount: payVal,
        payment_method: selectedPaymentMethod,
        status: isFinalPayment ? 'PAID' : 'PARTIALLY_PAID',
        transaction_reference: `TXN-${Date.now()}`,
      })

      triggerLiveActivity('paymentSuccess', { amount: payVal })
      setBillMessage(`Payment of ₹${payVal.toFixed(2)} recorded successfully.`)
      setTimeout(() => setBillMessage(''), 3000)

      // Reload payments
      const allPayments = await fetchPayments(token)
      const filtered = allPayments.filter((p) => p.invoice_id === invoice.id)
      setPayments(filtered)

      if (isFinalPayment) {
        // Trigger Receipt Preview emerging animation modal
        setShowPrintModal(true)
        // Check default printer status
        const defaultPrinter = printers.find(p => p.is_default)
        if (defaultPrinter && defaultPrinter.status !== 'Ready') {
          setPrinterError(`Printer error: Printer '${defaultPrinter.printerName}' status is '${defaultPrinter.status}'.`)
        } else {
          setPrinterError(null)
        }
      }
    } catch (err: any) {
      setBillMessage(err?.response?.data?.message || 'Failed to submit payment.')
    } finally {
      setPaymentProcessing(false)
    }
  }

  // Hold checkout
  const handleHoldCheckout = async () => {
    if (!token || !selectedOrderId) return
    try {
      await orderService.updateOrderStatus(selectedOrderId, orderService.OrderStatus.ON_HOLD, token)
      navigate('/billing')
    } catch (err) {
      console.error('Failed to put checkout on hold', err)
    }
  }

  // Reopen and edit items flows
  const handleStartReopen = () => {
    if (!selectedOrder) return
    const list = displayOrderItems.map(item => ({
      menu_item_id: item.id || '',
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }))
    setEditingItemsList(list)
    setIsEditingItems(true)
  }

  const handleUpdateItemQty = (menuItemId: string, change: number) => {
    setEditingItemsList(prev => prev.map(item => {
      if (item.menu_item_id === menuItemId) {
        return { ...item, quantity: Math.max(1, item.quantity + change) }
      }
      return item
    }))
  }

  const handleRemoveItem = (menuItemId: string) => {
    setEditingItemsList(prev => prev.filter(item => item.menu_item_id !== menuItemId))
  }

  const handleAddItem = () => {
    const item = menuItems.find(mi => mi.id === selectedAddItem)
    if (!item) return
    
    // Check if item already exists
    const exists = editingItemsList.find(mi => mi.menu_item_id === item.id)
    if (exists) {
      setEditingItemsList(prev => prev.map(mi => {
        if (mi.menu_item_id === item.id) {
          return { ...mi, quantity: mi.quantity + addQty }
        }
        return mi
      }))
    } else {
      setEditingItemsList(prev => [...prev, {
        menu_item_id: item.id,
        name: item.name,
        quantity: addQty,
        price: item.price
      }])
    }
    setAddQty(1)
  }

  const handleSaveReopenedBill = async () => {
    if (!token || !selectedOrderId) return
    setLoading(true)
    try {
      const payload = editingItemsList.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity
      }))
      await orderService.updateOrderItems(selectedOrderId, payload, token)
      setIsEditingItems(false)
      setInvoice(null) // Cleared so they regenerate bill with new totals
      setAppliedDiscount(0)
      
      // Reload orders
      const billable = await fetchBillableOrders(token)
      setOrders(billable)
      setBillMessage('Order items updated. Recalculated totals, invoice cleared.')
      setTimeout(() => setBillMessage(''), 4000)
    } catch (err: any) {
      setBillMessage(err?.response?.data?.message || 'Failed to update order items.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 text-white relative">
      <AnimatePresence>
        {/* Manager PIN Modal */}
        {showManagerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0e1624] p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white">Manager Approval Required</h3>
              <p className="mt-2 text-sm text-slate-400">
                Applied discount exceeds standard cashier limits. Enter Manager credentials PIN to authorize.
              </p>
              
              <div className="mt-6 space-y-4">
                <input
                  type="password"
                  placeholder="Enter Manager PIN (e.g. 1234)"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  maxLength={6}
                  className="w-full rounded-3xl border border-white/10 bg-slate-900 px-5 py-4 text-center text-lg font-bold text-white tracking-widest outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                />
                
                {pinError && <p className="text-sm text-rose-400 text-center font-medium">{pinError}</p>}
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManagerModal(false)
                      setPendingDiscountValue(null)
                    }}
                    className="flex-1 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-semibold transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitPinApproval}
                    disabled={loading || !managerPin}
                    className="flex-1 rounded-full bg-amber-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
                  >
                    {loading ? 'Validating...' : 'Authorize'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Print Receipt emerging modal */}
        {showPrintModal && (
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
              className="w-full max-w-2xl rounded-[2.5rem] border border-white/10 bg-[#0e1624] p-8 shadow-2xl flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-2xl font-bold">Payment Completed Successfully!</h3>
                  <p className="text-xs text-slate-400 mt-1">Invoice: {invoice?.invoice_number}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {printerError && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
                  {printerError}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Receipt format option</label>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(['58mm', '80mm', 'A4', 'PDF'] as const).map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setReceiptFormat(format)}
                        className={`rounded-2xl py-3 text-xs font-semibold transition ${
                          receiptFormat === format
                            ? 'bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-400/30'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {format === '58mm' ? '58mm Thermal' : format === '80mm' ? '80mm Thermal' : format === 'A4' ? 'A4 Invoice' : 'PDF Receipt'}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl bg-white/5 p-4 border border-white/5 space-y-3">
                    <p className="text-xs font-semibold text-slate-400">Target Printer</p>
                    <p className="text-sm font-bold text-white">
                      {printers.find(p => p.isDefault)?.printerName || 'No default printer configured'}
                    </p>
                    <p className="text-3xs text-slate-400">
                      Settings can be modified in Restaurant Configuration.
                    </p>
                  </div>
                </div>

                {/* Thermal Scroll preview container */}
                <div className="rounded-3xl bg-[#090b11] border border-white/10 p-5 max-h-[300px] overflow-y-auto flex flex-col items-center">
                  <p className="text-4xs text-slate-500 uppercase tracking-widest font-extrabold mb-3">Live print preview</p>
                  <motion.div
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className={`bg-white text-slate-900 p-4 font-mono text-[9px] shadow-lg rounded-sm leading-relaxed ${
                      receiptFormat === '58mm' ? 'w-[180px]' : receiptFormat === '80mm' ? 'w-[250px]' : 'w-[320px]'
                    }`}
                  >
                    <div className="text-center font-bold text-xs border-b border-dashed border-slate-400 pb-2 mb-2">
                      {defaultBillingTemplate.restaurantName}
                    </div>
                    <pre className="whitespace-pre-wrap text-center mb-2">{defaultBillingTemplate.headerTemplate}</pre>
                    <div className="border-b border-dashed border-slate-400 pb-2 mb-2 space-y-1">
                      <p>INV: {invoice?.invoice_number}</p>
                      <p>TABLE: T{selectedOrder?.table_number}</p>
                      <p>WAITER: {selectedOrder?.waiter_name || 'Staff'}</p>
                      <p>GUESTS: {selectedOrder?.guest_count}</p>
                      <p>DATE: {invoice ? new Date(invoice.issue_date).toLocaleString() : new Date().toLocaleString()}</p>
                    </div>

                    <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
                      {displayOrderItems.map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.quantity} x {item.name}</span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-b border-dashed border-slate-400 pb-2 mb-2 text-right space-y-0.5">
                      <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
                      <p>GST ({gstPercent}%): ₹{calculatedGst.toFixed(2)}</p>
                      {applyServiceCharge && <p>Service ({serviceChargePercent}%): ₹{calculatedServiceCharge.toFixed(2)}</p>}
                      {applyPackingCharge && <p>Packing: ₹{calculatedPacking.toFixed(2)}</p>}
                      {appliedDiscount > 0 && <p className="font-bold">Discount: -₹{appliedDiscount.toFixed(2)}</p>}
                      <p className="font-bold text-xs mt-1 border-t border-dashed border-slate-400 pt-1">
                        Grand Total: ₹{invoice?.total_amount.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-center font-bold mb-1">
                      PAID - THANK YOU
                    </div>
                    <pre className="whitespace-pre-wrap text-center text-3xs text-slate-500">{defaultBillingTemplate.footerTemplate}</pre>
                  </motion.div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 rounded-full border border-white/10 bg-white/5 py-3.5 text-xs font-bold uppercase tracking-wider transition hover:bg-white/10"
                >
                  Close & Clear Table
                </button>
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(invoice))}`}
                  download={`invoice-${invoice?.invoice_number}.json`}
                  className="flex-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 py-3.5 text-xs font-bold uppercase tracking-wider text-center transition"
                >
                  Download PDF / Data
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setPrinterError(null)
                    setBillMessage('Printing receipt...')
                    setTimeout(() => setBillMessage(''), 3000)
                  }}
                  className="flex-1 rounded-full bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 py-3.5 text-xs font-bold uppercase tracking-wider transition"
                >
                  Reprint Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="rounded-[2.5rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70">Billing Studio</p>
            <h1 className="mt-4 text-4xl font-bold text-white tracking-tight">Checkout Experience</h1>
            <p className="mt-2 text-slate-400 max-w-2xl">
              Process served ticket orders, apply custom charges and discounts, and handle payments.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleHoldCheckout}
              disabled={!selectedOrderId}
              className="rounded-full bg-white/5 border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 transition disabled:opacity-50"
            >
              Hold Checkout
            </button>
            <button
              type="button"
              onClick={() => navigate('/billing')}
              className="rounded-full bg-cyan-500/15 border border-cyan-400/20 px-5 py-3 text-xs font-bold uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/25 transition"
            >
              Billing Queue Dashboard
            </button>
          </div>
        </div>

        {billMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 font-medium">
            {billMessage}
          </div>
        )}
      </section>

      {/* Main Grid split */}
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        
        {/* Left Side Panel: Checkout calculations & Reopen Flow */}
        <div className="space-y-6">
          
          {/* Order Selector Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-6">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Selected Checkout Ticket</label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950 px-5 py-4 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="">Select an active table order...</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  Table T{order.table_number} ({order.waiter_name || 'Assigned'}) — ₹{order.total_amount.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Edit items (Reopen) Panel */}
          {isEditingItems ? (
            <div className="rounded-3xl border border-amber-400/30 bg-[#0d1222] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-amber-300">Reopened Invoice: Modify Items</h3>
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-3xs font-semibold text-amber-300">Edit Mode</span>
              </div>

              {/* Items currently in editing list */}
              <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto pr-2 space-y-3">
                {editingItemsList.map(item => (
                  <div key={item.menu_item_id} className="flex items-center justify-between py-2 text-xs">
                    <div className="flex-1 pr-4 min-w-0">
                      <p className="font-semibold text-white truncate">{item.name}</p>
                      <p className="text-slate-400 mt-0.5">₹{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(item.menu_item_id, -1)}
                        className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                      >
                        -
                      </button>
                      <span className="font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(item.menu_item_id, 1)}
                        className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.menu_item_id)}
                        className="text-rose-400 hover:text-rose-300 font-bold ml-2 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline catalog add items */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <p className="text-3xs font-extrabold uppercase tracking-widest text-slate-500">Insert new menu items</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedAddItem}
                    onChange={(e) => setSelectedAddItem(e.target.value)}
                    className="flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs outline-none"
                  >
                    <option value="">Choose item...</option>
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} — ₹{item.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      className="w-16 rounded-2xl border border-white/10 bg-slate-950 px-3 py-2.5 text-xs text-center"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!selectedAddItem}
                      className="rounded-2xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingItems(false)}
                  className="flex-1 rounded-full border border-white/10 bg-white/5 py-3 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReopenedBill}
                  className="flex-1 rounded-full bg-amber-400 text-slate-950 py-3 text-xs font-bold uppercase tracking-wider transition hover:bg-amber-300"
                >
                  Save & Recalculate
                </button>
              </div>
            </div>
          ) : (
            // Invoice Summary & Calculations Card
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-xl font-bold">Charges & Tax Structure</h3>
                {!invoice && (
                  <button
                    type="button"
                    onClick={handleStartReopen}
                    className="text-xs font-bold uppercase tracking-widest text-amber-300 hover:text-amber-200"
                  >
                    ✏️ Reopen & Edit items
                  </button>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Tax inputs */}
                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <p className="text-3xs font-extrabold uppercase tracking-widest text-slate-500">Government taxes</p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      value={gstPercent}
                      onChange={(e) => setGstPercent(Math.max(0, parseInt(e.target.value) || 0))}
                      min={0}
                      className="w-16 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-center"
                    />
                    <span className="text-xs text-slate-400">% GST Rate</span>
                  </div>
                </div>

                {/* Service charge input */}
                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-3xs font-extrabold uppercase tracking-widest text-slate-500">Service Charge</p>
                    <input
                      type="checkbox"
                      checked={applyServiceCharge}
                      onChange={(e) => setApplyServiceCharge(e.target.checked)}
                      className="rounded border-white/10 bg-slate-900 accent-cyan-500 h-4 w-4"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      value={serviceChargePercent}
                      onChange={(e) => setServiceChargePercent(Math.max(0, parseInt(e.target.value) || 0))}
                      disabled={!applyServiceCharge}
                      min={0}
                      className="w-16 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-center disabled:opacity-40"
                    />
                    <span className="text-xs text-slate-400">% Staff service share</span>
                  </div>
                </div>

                {/* Packaging charge input */}
                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-3xs font-extrabold uppercase tracking-widest text-slate-500">Packaging fee</p>
                    <input
                      type="checkbox"
                      checked={applyPackingCharge}
                      onChange={(e) => setApplyPackingCharge(e.target.checked)}
                      className="rounded border-white/10 bg-slate-900 accent-cyan-500 h-4 w-4"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      value={packingCharge}
                      onChange={(e) => setPackingCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                      disabled={!applyPackingCharge}
                      min={0}
                      className="w-20 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-center disabled:opacity-40"
                    />
                    <span className="text-xs text-slate-400">₹ Flat packing fee</span>
                  </div>
                </div>

                {/* Discount input */}
                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 text-3xs font-extrabold uppercase tracking-widest text-slate-500">
                    <span>Discount structure</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDiscountType('percent')}
                        className={`px-2 py-0.5 rounded-full ${discountType === 'percent' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'}`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('fixed')}
                        className={`px-2 py-0.5 rounded-full ${discountType === 'fixed' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'}`}
                      >
                        ₹
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {discountType === 'percent' ? (
                      <input
                        type="number"
                        value={discountPercentValue}
                        onChange={(e) => setDiscountPercentValue(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-center"
                        min={0}
                        max={100}
                        placeholder="%"
                      />
                    ) : (
                      <input
                        type="number"
                        value={discountFixedValue}
                        onChange={(e) => setDiscountFixedValue(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-24 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-center"
                        min={0}
                        placeholder="₹"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      className="rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-200 px-4 py-2 text-xs font-bold hover:bg-amber-400/30 transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Panel: Checkout summary receipt visual */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="rounded-[2rem] border border-white/10 bg-[#0c101c]/80 p-6 flex flex-col justify-between"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80 mb-6">Receipt Visualizer</p>
            
            <div className="rounded-3xl bg-slate-950/80 p-6 border border-white/5 space-y-4">
              <div className="text-center pb-3 border-b border-white/5">
                <h4 className="text-lg font-bold text-white">{defaultBillingTemplate.restaurantName}</h4>
                <p className="text-3xs text-slate-400 mt-1">Table T{selectedOrder?.table_number || '--'} Checkout</p>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                {displayOrderItems.map(item => (
                  <div key={item.id} className="flex justify-between items-start text-xs">
                    <span className="text-slate-300 truncate max-w-[160px]">{item.quantity} x {item.name}</span>
                    <span className="font-semibold text-white">₹{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="border-t border-white/5 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST ({gstPercent}%)</span>
                  <span>₹{calculatedGst.toFixed(2)}</span>
                </div>
                {applyServiceCharge && (
                  <div className="flex justify-between text-slate-400">
                    <span>Service charge ({serviceChargePercent}%)</span>
                    <span>₹{calculatedServiceCharge.toFixed(2)}</span>
                  </div>
                )}
                {applyPackingCharge && (
                  <div className="flex justify-between text-slate-400">
                    <span>Packaging fee</span>
                    <span>₹{calculatedPacking.toFixed(2)}</span>
                  </div>
                )}
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-amber-300 font-medium">
                    <span>Authorized Discount</span>
                    <span>-₹{appliedDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-white/10 pt-3 flex justify-between text-base font-bold text-white">
                  <span>Grand Total</span>
                  <span className="text-emerald-400">₹{invoice ? invoice.total_amount.toFixed(2) : grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Bill Generation Trigger */}
            {!invoice ? (
              <button
                type="button"
                onClick={handleGenerateBill}
                disabled={loading || !selectedOrderId}
                className="mt-6 w-full rounded-full bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 py-4 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 shadow-lg shadow-cyan-500/10"
              >
                {loading ? 'Issuing Bill...' : 'Generate Invoice Bill'}
              </button>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex justify-between items-center text-xs">
                  <div>
                    <p className="text-slate-400 font-semibold">Bill No: {invoice.invoice_number}</p>
                    <p className="text-slate-400 mt-0.5">Status: <span className="text-cyan-300 font-bold uppercase">{invoice.status}</span></p>
                  </div>
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-cyan-300 font-bold text-3xs">Issued</span>
                </div>

                {/* Multiple Payment Studio */}
                <div className="rounded-3xl border border-white/5 bg-[#0a0e1b] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <p className="text-3xs font-extrabold uppercase tracking-widest text-slate-500">Payment Selection</p>
                    <div className="flex gap-2">
                      {(['full', 'equal', 'custom'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPaymentMode(mode)}
                          className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider transition ${
                            paymentMode === mode ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                          }`}
                        >
                          {mode === 'full' ? 'Full' : mode === 'equal' ? 'Split' : 'Custom'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMode === 'equal' && (
                    <div className="flex items-center justify-between text-xs border-b border-white/5 pb-3">
                      <span className="text-slate-400">Guest Splits:</span>
                      <input
                        type="number"
                        value={guestSplits}
                        onChange={(e) => setGuestSplits(Math.max(2, parseInt(e.target.value) || 2))}
                        min={2}
                        className="w-12 rounded-xl border border-white/10 bg-slate-900 px-2 py-1 text-center"
                      />
                    </div>
                  )}

                  {/* Dynamic Paid Status metrics */}
                  <div className="grid grid-cols-2 gap-3 text-2xs">
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-slate-400">Total Paid</p>
                      <p className="text-sm font-bold text-emerald-400 mt-1">₹{totalPaid.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-slate-400">Unpaid Balance</p>
                      <p className="text-sm font-bold text-rose-400 mt-1">₹{unpaidBalance.toFixed(2)}</p>
                    </div>
                  </div>

                  {unpaidBalance > 0 ? (
                    <div className="space-y-4">
                      {/* Payment method selections */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {(['Cash', 'UPI', 'Credit Card', 'Debit Card'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setSelectedPaymentMethod(method)}
                            className={`rounded-xl py-2 text-4xs font-extrabold uppercase tracking-widest text-center transition ${
                              selectedPaymentMethod === method
                                ? 'bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-400/30'
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>

                      {/* Payment value input and trigger */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-3.5 text-slate-500 text-xs">₹</span>
                          <input
                            type="number"
                            value={customPayAmount}
                            onChange={(e) => setCustomPayAmount(e.target.value)}
                            max={unpaidBalance}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900 pl-7 pr-3 py-3 text-xs font-semibold text-white outline-none"
                            placeholder="Amount"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handlePay}
                          disabled={paymentProcessing}
                          className="rounded-2xl bg-emerald-400 text-slate-950 font-bold px-6 py-3 text-xs hover:bg-emerald-300 disabled:opacity-50 transition"
                        >
                          {paymentProcessing ? 'Processing...' : 'Pay'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                      <p className="text-xs font-bold text-emerald-300">Invoice Fully Paid!</p>
                      <button
                        type="button"
                        onClick={() => setShowPrintModal(true)}
                        className="mt-3 rounded-full bg-cyan-500 text-slate-950 px-5 py-2 text-xs font-bold hover:bg-cyan-400 transition"
                      >
                        Print/View Receipt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </div>
  )
}

export default BillingEditor
