"use client"

import { useEffect, useState, use } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ChevronLeft, Trash2, Users, User, Clock, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"
import * as orderService from "@/lib/services/orderService"

const STATUS_SEQUENCE = [
  orderService.OrderStatus.NEW,
  orderService.OrderStatus.SENT_TO_KITCHEN,
  orderService.OrderStatus.PREPARING,
  orderService.OrderStatus.READY,
  orderService.OrderStatus.SERVED,
  orderService.OrderStatus.BILL_REQUESTED,
  orderService.OrderStatus.PAID,
]

const STATUS_LABELS: Record<orderService.OrderStatus, string> = {
  [orderService.OrderStatus.NEW]: "New",
  [orderService.OrderStatus.SENT_TO_KITCHEN]: "Sent to Kitchen",
  [orderService.OrderStatus.PREPARING]: "Preparing",
  [orderService.OrderStatus.READY]: "Ready",
  [orderService.OrderStatus.SERVED]: "Served",
  [orderService.OrderStatus.BILL_REQUESTED]: "Bill Requested",
  [orderService.OrderStatus.CHECKOUT_OPEN]: "Checkout In Progress",
  [orderService.OrderStatus.ON_HOLD]: "On Hold",
  [orderService.OrderStatus.PAID]: "Paid",
  [orderService.OrderStatus.REFUNDED]: "Refunded",
}

const getStatusVariant = (status: orderService.OrderStatus): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
  switch (status) {
    case orderService.OrderStatus.NEW:
    case orderService.OrderStatus.SENT_TO_KITCHEN:
      return "info"
    case orderService.OrderStatus.PREPARING:
      return "warning"
    case orderService.OrderStatus.READY:
      return "success"
    case orderService.OrderStatus.SERVED:
      return "default"
    case orderService.OrderStatus.BILL_REQUESTED:
    case orderService.OrderStatus.CHECKOUT_OPEN:
      return "warning"
    case orderService.OrderStatus.PAID:
      return "success"
    default:
      return "outline"
  }
}

export default function OrderDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { token, sseActive } = useAuth()

  const [order, setOrder] = useState<orderService.Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!token || !id) return

    const fetchOrderDetails = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true)
        const data = await orderService.getOrderById(id, token)
        setOrder(data)
      } catch (err: any) {
        console.error("Failed to load order:", err)
        toast.error("Failed to fetch order details.")
      } finally {
        if (showLoading) setLoading(false)
      }
    }

    fetchOrderDetails(true)

    const onUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.type === "order_cancelled" && customEvent.detail?.id === id) {
        toast.info("Order was cancelled")
        router.push("/orders")
        return
      }
      if (customEvent.type === "ordersUpdated" || !customEvent.detail || customEvent.detail.id === id) {
        fetchOrderDetails(false)
      }
    }

    window.addEventListener("ordersUpdated", onUpdate)
    window.addEventListener("order_created", onUpdate)
    window.addEventListener("order_updated", onUpdate)
    window.addEventListener("order_completed", onUpdate)
    window.addEventListener("order_cancelled", onUpdate)

    const pollInterval = sseActive ? 15000 : 5000
    const iv = setInterval(() => fetchOrderDetails(false), pollInterval)

    return () => {
      window.removeEventListener("ordersUpdated", onUpdate)
      window.removeEventListener("order_created", onUpdate)
      window.removeEventListener("order_updated", onUpdate)
      window.removeEventListener("order_completed", onUpdate)
      window.removeEventListener("order_cancelled", onUpdate)
      clearInterval(iv)
    }
  }, [token, id, router, sseActive])

  const handleUpdateStatus = async (newStatus: orderService.OrderStatus) => {
    if (!token || !id) return
    try {
      setUpdating(true)
      const updated = await orderService.updateOrderStatus(id, newStatus, token)
      setOrder(updated)
      toast.success(`Order status updated to ${STATUS_LABELS[newStatus]}`)
    } catch (err: any) {
      console.error("Failed to update status:", err)
      toast.error("Failed to update order status")
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!token || !id) return
    if (!window.confirm("Are you sure you want to delete this order?")) return
    try {
      setUpdating(true)
      await orderService.deleteOrder(id, token)
      toast.success("Order deleted successfully")
      router.push("/orders")
    } catch (err: any) {
      console.error("Failed to delete order:", err)
      toast.error("Failed to delete order")
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-muted-foreground">Order details could not be found or you don't have access.</p>
        <Button onClick={() => router.push("/orders")} className="mt-4">
          Return to Orders
        </Button>
      </div>
    )
  }

  const currentIdx = STATUS_SEQUENCE.indexOf(order.status)
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_SEQUENCE.length - 1 ? STATUS_SEQUENCE[currentIdx + 1] : null

  const subtotal = order.total_amount
  const tax = subtotal * 0.18
  const grandTotal = subtotal + tax

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/orders")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Order #{order.id.substring(0, 8)}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Full Reference: {order.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {nextStatus && (
            <Button
              onClick={() => handleUpdateStatus(nextStatus)}
              disabled={updating}
              className="font-medium"
            >
              Advance: {STATUS_LABELS[nextStatus]}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDeleteOrder}
            disabled={updating}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Properties */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Order Properties</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Guest Count</p>
                  <p className="text-lg font-bold text-foreground">{order.guest_count} guest(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Waiter</p>
                  <p className="text-lg font-bold text-foreground">{order.waiter_name || "Staff Member"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Timeline Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2 pl-4 md:pl-0">
                {/* Connector line */}
                <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-border md:left-4 md:right-4 md:top-[18px] md:h-0.5 md:w-auto md:bottom-auto" />
                
                {STATUS_SEQUENCE.map((status, index) => {
                  const isActive = index <= currentIdx
                  const isCurrent = index === currentIdx

                  return (
                    <div key={status} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2.5">
                      <button
                        onClick={() => handleUpdateStatus(status)}
                        disabled={updating}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition ${
                          isCurrent
                            ? "border-primary bg-primary text-primary-foreground font-bold scale-110 shadow-lg shadow-primary/20"
                            : isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </button>

                      <div className="text-left md:text-center">
                        <p className={`text-xs font-semibold ${isCurrent ? "text-foreground" : isActive ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                          {STATUS_LABELS[status]}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: cart items */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Items Ordered</CardTitle>
              {/* @ts-ignore */}
              <Badge variant={getStatusVariant(order.status)}>
                {STATUS_LABELS[order.status]}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-start py-1 border-b border-border/40 pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-sm font-medium truncate">{item.name || `Item ${item.menu_item_id.substring(0,4)}`}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ₹{item.unit_price} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">
                      ₹{item.subtotal}
                    </span>
                  </div>
                ))}
                {(!order.items || order.items.length === 0) && (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No items listed.
                  </div>
                )}
              </div>

              {/* Pricing Totals */}
              <div className="border-t border-border pt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-border pt-2 text-foreground">
                  <span>Grand Total</span>
                  <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
