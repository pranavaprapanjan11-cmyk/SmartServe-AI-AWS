"use client"

import { useEffect, useState, useMemo, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, Trash2, Receipt, CreditCard, Smartphone, Banknote, IndianRupee, Check, ShieldAlert, Printer, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AnimatedNumber } from "@/components/shared/animated-number"
import { useAuth } from "@/context/AuthContext"
import * as billingService from "@/lib/services/billingService"
import * as orderService from "@/lib/services/orderService"
import * as settingsService from "@/lib/services/settingsService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const payMethods = [
  { label: "UPI", val: "UPI", icon: Smartphone },
  { label: "Card", val: "Credit Card", icon: CreditCard },
  { label: "Cash", val: "Cash", icon: Banknote },
] as const

function BillingPage() {
  const { token } = useAuth()
  
  // Data
  const [billableOrders, setBillableOrders] = useState<billingService.BillableOrder[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>("")
  const [payMethod, setPayMethod] = useState<"Cash" | "UPI" | "Credit Card" | "Debit Card">("UPI")
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [gstPercent, setGstPercent] = useState<number>(18)
  
  // UI States
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState(false)
  const [settled, setSettled] = useState(false)
  const [lastInvoice, setLastInvoice] = useState<any>(null)
  const [restaurantProfile, setRestaurantProfile] = useState<any>(null)

  const loadBillingData = useCallback(async (showLoading = true) => {
    if (!token) {
      setLoading(false)
      return
    }
    if (showLoading) setLoading(true)
    try {
      const orders = await billingService.fetchBillableOrders(token)
      setBillableOrders(orders)
      
      // Auto-select first order if none selected or if selected is no longer active
      if (orders.length > 0) {
        if (!selectedOrderId || !orders.some(o => o.id === selectedOrderId)) {
          setSelectedOrderId(orders[0].id)
        }
      } else {
        setSelectedOrderId("")
      }
    } catch (err: any) {
      console.error("Failed to load active orders:", err)
      toast.error("Failed to load active orders.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token, selectedOrderId])

  // Load profile and orders
  useEffect(() => {
    async function loadProfileAndData() {
      if (!token) return
      try {
        setLoading(true)
        const profile = await settingsService.fetchRestaurantSettings(token)
        setRestaurantProfile(profile)
        if (profile && profile.tax_percent !== undefined) {
          setGstPercent(Number(profile.tax_percent))
        }
        await loadBillingData(false)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProfileAndData()
  }, [token])

  useEffect(() => {
    const handleUpdate = () => loadBillingData(false)
    window.addEventListener("ordersUpdated", handleUpdate)
    window.addEventListener("tablesUpdated", handleUpdate)
    return () => {
      window.removeEventListener("ordersUpdated", handleUpdate)
      window.removeEventListener("tablesUpdated", handleUpdate)
    }
  }, [loadBillingData])

  const selectedOrder = useMemo(() => {
    return billableOrders.find((o) => o.id === selectedOrderId) || null
  }, [billableOrders, selectedOrderId])

  // Calculations
  const subtotal = useMemo(() => {
    if (!selectedOrder) return 0
    return selectedOrder.items?.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) || selectedOrder.total_amount
  }, [selectedOrder])

  const tax = useMemo(() => {
    return Math.round(subtotal * (gstPercent / 100))
  }, [subtotal, gstPercent])

  const total = useMemo(() => {
    return Math.max(0, subtotal + tax - discountAmount)
  }, [subtotal, tax, discountAmount])

  const handleSettle = async () => {
    if (!token || !selectedOrder) return
    try {
      setSettling(true)
      
      // 1. Create Invoice
      const invoicePayload: billingService.InvoicePayload = {
        order_id: selectedOrder.id,
        tax_percent: gstPercent,
        discount_amount: discountAmount,
      }
      
      const invoice = await billingService.createInvoice(token, invoicePayload)
      
      // 2. Submit Payment
      const paymentPayload: billingService.PaymentPayload = {
        invoice_id: invoice.id,
        amount: invoice.total_amount,
        payment_method: payMethod,
        status: "PAID",
      }
      
      await billingService.submitPayment(token, paymentPayload)
      
      // Update order status to paid locally
      await orderService.updateOrderStatus(selectedOrder.id, orderService.OrderStatus.PAID, token)

      // Dispatch live activity events
      const activityEvent = new CustomEvent("liveActivityEvent", {
        detail: { type: "paymentSuccess", data: { invoiceId: invoice.id, amount: invoice.total_amount } }
      })
      window.dispatchEvent(activityEvent)
      window.dispatchEvent(new CustomEvent("ordersUpdated"))
      window.dispatchEvent(new CustomEvent("tablesUpdated"))

      setLastInvoice(invoice)
      setSettled(true)
      toast.success(`Bill settled successfully for Table ${selectedOrder.table_number}!`)
    } catch (err: any) {
      console.error("Failed to settle bill:", err)
      toast.error(err?.response?.data?.message || "Failed to process payment settlement. Try again.")
    } finally {
      setSettling(false)
    }
  }

  const handleDone = () => {
    setSettled(false)
    setLastInvoice(null)
    setSelectedOrderId("")
    setDiscountAmount(0)
    loadBillingData(false)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="POS Billing" description="Process table invoices, manage GST/Discounts and log payments" />
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="h-[400px] rounded-2xl bg-muted/30 lg:col-span-2 border border-border/40" />
            <div className="h-[400px] rounded-2xl bg-muted/30 lg:col-span-3 border border-border/40" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="POS Billing" description="Process table invoices, manage GST/Discounts and log payments" />

      {billableOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl bg-card/40">
          <Receipt className="h-12 w-12 text-muted-foreground/35 mb-3" />
          <h3 className="font-semibold text-lg text-foreground">No Active Bills</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            When waiters place orders and serve tables, they will appear here in the settlement queue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Active Tables List (Left) */}
          <div className="space-y-4 lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Settlement Queue</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 overflow-y-auto max-h-[70vh] pr-1">
              {billableOrders.map((order) => {
                const isActive = order.id === selectedOrderId
                return (
                  <motion.button
                    key={order.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (!settled) {
                        setSelectedOrderId(order.id)
                        setDiscountAmount(0)
                      }
                    }}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                      isActive
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-serif text-lg font-bold text-foreground">Table {order.table_number}</span>
                      <Badge variant={order.status === "BILL_REQUESTED" ? "warning" : "secondary"}>
                        {order.status === "BILL_REQUESTED" ? "Bill Requested" : order.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                      <span>Waiter: {order.waiter_name || "Staff"}</span>
                      <span>{order.guest_count} Guest(s)</span>
                    </div>
                    <div className="flex w-full items-center justify-between border-t border-border/50 pt-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {order.items?.length || 0} items
                      </span>
                      <span className="font-semibold text-primary">
                        ₹{order.total_amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Checkout Editor Panel (Right) */}
          <div className="lg:col-span-3">
            {selectedOrder ? (
              <Card className="sticky top-6 overflow-hidden border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Receipt className="h-4 w-4 text-primary" /> Bill Details
                  </CardTitle>
                  <Badge variant="outline" className="text-sm font-semibold text-foreground border-border">
                    Table {selectedOrder.table_number}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 relative">
                  {/* Items list */}
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-start py-1 border-b border-border/40 pb-2 last:border-0 last:pb-0 text-sm">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-medium truncate text-foreground">{item.name || `Item ${item.menu_item_id.substring(0,4)}`}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ₹{item.unit_price} × {item.quantity}
                          </p>
                        </div>
                        <span className="font-semibold text-foreground shrink-0">
                          ₹{item.subtotal}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Settings / Adjustments */}
                  <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/50">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GST Rate (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={gstPercent}
                        onChange={(e) => setGstPercent(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-foreground bg-background border-border"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discount (₹)</label>
                      <Input
                        type="number"
                        min="0"
                        max={subtotal}
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Math.max(0, Math.min(subtotal, parseInt(e.target.value) || 0)))}
                        className="text-foreground bg-background border-border"
                      />
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="space-y-1.5 border-t border-dashed border-border pt-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>GST ({gstPercent}%)</span>
                      <span>₹{tax.toLocaleString("en-IN")}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Discount</span>
                        <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between pt-1 text-base font-semibold text-foreground">
                      <span>Total Amount</span>
                      <AnimatedNumber value={total} prefix="₹" duration={400} className="font-serif text-xl text-primary" />
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-2 border-t border-border/50 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Method</p>
                    <div className="grid grid-cols-3 gap-2">
                      {payMethods.map((m) => {
                        const active = payMethod === m.val
                        return (
                          <motion.button
                            key={m.label}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setPayMethod(m.val as any)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition-all",
                              active
                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                : "border-border text-muted-foreground hover:border-primary/40 bg-muted/20"
                            )}
                          >
                            <m.icon className="h-4.5 w-4.5" />
                            {m.label}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Settle Action */}
                  <Button
                    className="w-full h-11 text-sm font-semibold mt-2"
                    disabled={settling || total <= 0}
                    onClick={handleSettle}
                  >
                    {settling ? "Processing..." : `Settle Bill · ₹${total.toLocaleString("en-IN")}`}
                  </Button>

                  {/* Settle Overlay with Printable Receipt (Billing Profile Integration) */}
                  <AnimatePresence>
                    {settled && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex flex-col bg-card overflow-y-auto p-4"
                      >
                        <div id="printable-receipt" className="flex-1 bg-white border border-gray-200 p-5 rounded-xl text-slate-800 font-mono shadow-sm text-xs leading-relaxed max-w-sm mx-auto w-full">
                          {/* Receipt Header (automatically pulls settings) */}
                          <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
                            <h2 className="text-base font-bold uppercase tracking-tight text-slate-900">
                              {restaurantProfile?.restaurant_name || "Saffron & Sage"}
                            </h2>
                            {restaurantProfile?.branch_name && (
                              <p className="text-[10px] text-gray-500 font-medium">
                                ({restaurantProfile.branch_name})
                              </p>
                            )}
                            <p className="text-[10px] text-gray-500 whitespace-pre-line leading-snug">
                              {restaurantProfile?.address || "123 Gourmet Lane,\nCreative District, India"}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              Ph: {restaurantProfile?.contact_number || "+91 98765 43210"}
                            </p>
                            {restaurantProfile?.gst_number && (
                              <p className="text-[10px] font-semibold text-slate-700">
                                GSTIN: {restaurantProfile.gst_number}
                              </p>
                            )}
                          </div>

                          {/* Bill details metadata */}
                          <div className="py-3 border-b border-dashed border-gray-300 space-y-0.5 text-[10px] text-gray-600">
                            <div className="flex justify-between">
                              <span>Bill No: {lastInvoice?.invoice_number || `INV-${Date.now()}`}</span>
                              <span>Table: T{selectedOrder.table_number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Date: {new Date().toLocaleString()}</span>
                              <span>Guests: {selectedOrder.guest_count}</span>
                            </div>
                            <div>
                              <span>Waiter: {selectedOrder.waiter_name || "Staff"}</span>
                            </div>
                          </div>

                          {/* Items Grid */}
                          <div className="py-3 border-b border-dashed border-gray-300 space-y-1.5">
                            {selectedOrder.items?.map((item) => (
                              <div key={item.id} className="flex justify-between text-[11px]">
                                <span className="flex-1 truncate pr-2">
                                  {item.name || `Item ${item.menu_item_id.substring(0,4)}`} × {item.quantity}
                                </span>
                                <span className="font-semibold text-slate-900 shrink-0">
                                  ₹{item.subtotal}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Invoice Totals */}
                          <div className="py-3 space-y-1 text-[11px] text-gray-600">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span>₹{subtotal.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>GST ({gstPercent}%)</span>
                              <span>₹{tax.toLocaleString("en-IN")}</span>
                            </div>
                            {discountAmount > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>Discount</span>
                                <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-dashed border-gray-300 pt-1.5 text-xs font-bold text-slate-900">
                              <span>Total Amount</span>
                              <span>₹{total.toLocaleString("en-IN")}</span>
                            </div>
                          </div>

                          {/* Payment Mode details & UPI Profile automatic insertion */}
                          <div className="mt-2 pt-3 border-t border-dashed border-gray-300 text-center space-y-1.5">
                            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-700">
                              Paid via {payMethod}
                            </p>
                            {payMethod === "UPI" && restaurantProfile?.upi_id && (
                              <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg space-y-1">
                                <p className="text-[9px] text-gray-500 font-semibold uppercase">
                                  UPI Payment Settled
                                </p>
                                <p className="text-[10px] text-slate-800 font-bold font-mono truncate">
                                  {restaurantProfile.upi_id}
                                </p>
                              </div>
                            )}
                            <p className="text-[9px] text-gray-400 italic pt-1">
                              Thank you for dining with us!
                            </p>
                          </div>
                        </div>

                        {/* Actions overlay buttons */}
                        <div className="flex gap-2 max-w-sm mx-auto w-full mt-4">
                          <Button variant="outline" onClick={handlePrint} className="flex-1 flex items-center justify-center gap-1.5 text-foreground border-border bg-background">
                            <Printer className="h-4 w-4" /> Print Bill
                          </Button>
                          <Button onClick={handleDone} className="flex-1 flex items-center justify-center gap-1.5 font-semibold">
                            Done <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ) : (
              <div className="flex h-48 items-center justify-center border border-dashed border-border rounded-2xl text-muted-foreground text-sm">
                Select an active order from the queue to start billing.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(BillingPage)
