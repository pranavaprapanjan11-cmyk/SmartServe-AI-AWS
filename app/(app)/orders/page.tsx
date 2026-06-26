"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Plus, Search, ClipboardList, Clock, IndianRupee, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/AuthContext"
import * as orderService from "@/lib/services/orderService"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"

const statusMeta: Record<string, { label: string; variant: "default" | "info" | "warning" | "success" | "secondary" }> = {
  NEW: { label: "New", variant: "info" },
  SENT_TO_KITCHEN: { label: "New", variant: "info" },
  PREPARING: { label: "Preparing", variant: "warning" },
  READY: { label: "Ready", variant: "success" },
  SERVED: { label: "Served", variant: "default" },
  BILL_REQUESTED: { label: "Bill Requested", variant: "secondary" },
  CHECKOUT_OPEN: { label: "Checkout Open", variant: "secondary" },
  PAID: { label: "Paid", variant: "secondary" },
}

const filters = ["all", "NEW", "PREPARING", "READY", "SERVED", "PAID"] as const

function OrderTicket({ order, index, token, onUpdate }: { order: orderService.Order; index: number; token: string; onUpdate: () => void }) {
  const router = useRouter()
  const meta = statusMeta[order.status] || { label: order.status, variant: "default" as const }
  const items = order.items || []

  const handleAdvanceStatus = async () => {
    try {
      let nextStatus = order.status
      if (order.status === "NEW" || order.status === "SENT_TO_KITCHEN") {
        nextStatus = orderService.OrderStatus.PREPARING
      } else if (order.status === "PREPARING") {
        nextStatus = orderService.OrderStatus.READY
      } else if (order.status === "READY") {
        nextStatus = orderService.OrderStatus.SERVED
      } else if (order.status === "SERVED") {
        nextStatus = orderService.OrderStatus.BILL_REQUESTED
      }

      await orderService.updateOrderStatus(order.id, nextStatus, token)
      toast.success(`Order #${order.id.substring(0, 8)} updated to ${nextStatus}`)
      onUpdate()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to update order status")
    }
  }

  // Elapsed minutes since creation
  const elapsedMin = order.created_at 
    ? Math.round((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60))
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg font-semibold">#{order.id.substring(0, 8)}</span>
            <Badge variant="outline">Table {order.table_number}</Badge>
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        <CardContent className="space-y-3 p-4">
          <div className="space-y-1.5 min-h-[60px] max-h-[120px] overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-sm">
                <span className="text-foreground">
                  <span className="font-medium text-muted-foreground">{item.quantity}×</span> {item.name || `Item ${item.menu_item_id.substring(0, 4)}`}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {elapsedMin} min · {order.waiter_name || "Staff"}
            </span>
            <span className="flex items-center font-semibold">
              <IndianRupee className="h-3.5 w-3.5" />
              {order.total_amount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/orders/${order.id}`}>Details</Link>
            </Button>
            {order.status !== "PAID" && (
              <Button
                size="sm"
                className="flex-1"
                onClick={handleAdvanceStatus}
              >
                {order.status === "READY" ? "Mark Served" : "Advance"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function OrdersPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [ordersList, setOrdersList] = useState<orderService.Order[]>([])
  const [filter, setFilter] = useState<(typeof filters)[number]>("all")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  const loadOrders = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const data = await orderService.getOrders(token)
      setOrdersList(data)
    } catch (err: any) {
      console.error("Failed to load orders:", err)
      toast.error("Failed to fetch order history.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadOrders(true)
  }, [loadOrders])

  useEffect(() => {
    const handleUpdate = () => loadOrders(false)
    window.addEventListener("ordersUpdated", handleUpdate)
    return () => {
      window.removeEventListener("ordersUpdated", handleUpdate)
    }
  }, [loadOrders])

  const filtered = ordersList.filter((o) => {
    const matchFilter = filter === "all" || 
      (filter === "NEW" && (o.status === "NEW" || o.status === "SENT_TO_KITCHEN")) ||
      o.status === filter
      
    const matchQuery =
      query === "" ||
      o.id.includes(query) ||
      o.table_number.toString().includes(query) ||
      (o.waiter_name && o.waiter_name.toLowerCase().includes(query.toLowerCase()))
    return matchFilter && matchQuery
  })

  const active = ordersList.filter((o) => o.status !== "PAID").length
  const totalRevenue = ordersList.filter(o => o.status === "PAID").reduce((sum, o) => sum + o.total_amount, 0)
  const readyCount = ordersList.filter((o) => o.status === "READY").length

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Track and manage all live and recent orders">
        <Button variant="outline" onClick={() => loadOrders(true)}>Refresh</Button>
        <Button asChild>
          <Link href="/orders/create">
            <Plus className="h-4 w-4" /> New Order
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Orders" value={active} icon={ClipboardList} accent="primary" index={0} />
        <StatCard label="Ready to Serve" value={readyCount} icon={CheckCircle2} accent="emerald" index={1} />
        <StatCard label="Total Orders" value={ordersList.length} icon={ClipboardList} accent="sky" index={2} />
        <StatCard
          label="Sales Revenue"
          value={`₹${(totalRevenue / 1000).toFixed(1)}k`}
          icon={IndianRupee}
          accent="copper"
          index={3}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as (typeof filters)[number])}>
          <TabsList className="flex-wrap">
            {filters.map((f) => (
              <TabsTrigger key={f} value={f} className="capitalize">
                {f.toLowerCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders by table or waiter..."
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={query ? "No orders match your search" : `No orders right now`}
          description={
            query
              ? "Try a different order number, table, or waiter name."
              : "When new tickets come in, they'll appear here in real time. Start one to get going."
          }
          actionLabel="New order"
          onAction={() => router.push("/orders/create")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((order, i) => (
            <OrderTicket key={order.id} order={order} index={i} token={token!} onUpdate={() => loadOrders(false)} />
          ))}
        </div>
      )}
    </div>
  )
}
