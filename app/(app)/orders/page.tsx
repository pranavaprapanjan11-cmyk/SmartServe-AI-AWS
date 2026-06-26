"use client"

import { useState } from "react"
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
import { orders, type Order, type OrderStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const statusMeta: Record<OrderStatus, { label: string; variant: "default" | "info" | "warning" | "success" | "secondary" }> = {
  new: { label: "New", variant: "info" },
  preparing: { label: "Preparing", variant: "warning" },
  ready: { label: "Ready", variant: "success" },
  served: { label: "Served", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
}

const filters = ["all", "new", "preparing", "ready", "served", "completed"] as const

function OrderTicket({ order, index }: { order: Order; index: number }) {
  const meta = statusMeta[order.status]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className={cn("overflow-hidden", order.priority === "high" && "border-destructive/40")}>
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg font-semibold">#{order.id}</span>
            <Badge variant="outline">{order.table}</Badge>
            {order.priority === "high" && <Badge variant="danger">Priority</Badge>}
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        <CardContent className="space-y-3 p-4">
          <div className="space-y-1.5">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-sm">
                <span className="text-foreground">
                  <span className="font-medium text-muted-foreground">{item.qty}×</span> {item.name}
                  {item.notes && <span className="ml-1 text-xs italic text-copper">({item.notes})</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {order.elapsedMin} min · {order.server}
            </span>
            <span className="flex items-center font-semibold">
              <IndianRupee className="h-3.5 w-3.5" />
              {order.total.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              Details
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() =>
                order.status === "ready"
                  ? toast.success(`Order #${order.id} served`, { description: `${order.table} · enjoy the meal!` })
                  : toast(`Order #${order.id} advanced`, { description: `Now moving down the line.` })
              }
            >
              {order.status === "ready" ? "Mark Served" : "Advance"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function OrdersPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all")
  const [query, setQuery] = useState("")

  const filtered = orders.filter((o) => {
    const matchFilter = filter === "all" || o.status === filter
    const matchQuery =
      query === "" ||
      o.id.includes(query) ||
      o.table.toLowerCase().includes(query.toLowerCase()) ||
      o.server.toLowerCase().includes(query.toLowerCase())
    return matchFilter && matchQuery
  })

  const active = orders.filter((o) => o.status !== "completed").length
  const revenue = orders.reduce((sum, o) => sum + o.total, 0)
  const ready = orders.filter((o) => o.status === "ready").length

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Track and manage all live and recent orders">
        <Button variant="outline">
          <Search className="h-4 w-4" /> Find Order
        </Button>
        <Button onClick={() => toast.success("New order started", { description: "Ticket opened — add items to begin." })}>
          <Plus className="h-4 w-4" /> New Order
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Orders" value={active} icon={ClipboardList} accent="primary" index={0} />
        <StatCard label="Ready to Serve" value={ready} icon={CheckCircle2} accent="emerald" index={1} />
        <StatCard label="Total Orders" value={orders.length} icon={ClipboardList} accent="sky" index={2} />
        <StatCard
          label="Order Revenue"
          value={`₹${(revenue / 1000).toFixed(1)}k`}
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
                {f}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders..."
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={query ? "No orders match your search" : `No ${filter === "all" ? "" : filter} orders right now`}
          description={
            query
              ? "Try a different order number, table, or server name."
              : "When new tickets come in, they'll appear here in real time. Start one to get going."
          }
          actionLabel="New order"
          onAction={() => {
            setFilter("all")
            setQuery("")
            toast.success("New order started", { description: "Ticket opened — add items to begin." })
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((order, i) => (
            <OrderTicket key={order.id} order={order} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
