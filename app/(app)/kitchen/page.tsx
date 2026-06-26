"use client"

import { motion } from "framer-motion"
import { Clock, Flame, CheckCircle2, ChefHat, Timer } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { orders, type Order } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const columns = [
  { key: "new", title: "Incoming", accent: "border-t-info", icon: Clock },
  { key: "preparing", title: "Cooking", accent: "border-t-warning", icon: Flame },
  { key: "ready", title: "Ready", accent: "border-t-success", icon: CheckCircle2 },
] as const

function urgency(elapsed: number) {
  if (elapsed >= 15) return "text-destructive"
  if (elapsed >= 8) return "text-warning"
  return "text-emerald-500"
}

function KitchenTicket({ order, index }: { order: Order; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={cn(order.priority === "high" && "ring-1 ring-destructive/40")}>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-semibold">#{order.id}</span>
              <Badge variant="outline">{order.table}</Badge>
            </div>
            <span className={cn("flex items-center gap-1 text-sm font-semibold", urgency(order.elapsedMin))}>
              <Timer className="h-3.5 w-3.5" /> {order.elapsedMin}m
            </span>
          </div>
          <ul className="space-y-1.5">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-baseline gap-2 text-sm">
                <span className="font-semibold text-primary">{item.qty}×</span>
                <span className="text-foreground">{item.name}</span>
                {item.notes && <span className="text-xs italic text-copper">· {item.notes}</span>}
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant={order.status === "ready" ? "outline" : "default"}
            className="w-full"
          >
            {order.status === "new" ? "Start Cooking" : order.status === "preparing" ? "Mark Ready" : "Bump Ticket"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function KitchenPage() {
  const queue = orders.filter((o) => ["new", "preparing", "ready"].includes(o.status))
  const cooking = orders.filter((o) => o.status === "preparing").length
  const readyCount = orders.filter((o) => o.status === "ready").length
  const avgTime = Math.round(queue.reduce((s, o) => s + o.elapsedMin, 0) / (queue.length || 1))

  return (
    <div className="space-y-6">
      <PageHeader title="Kitchen Display" description="Real-time ticket flow for the kitchen line">
        <Button variant="outline">
          <ChefHat className="h-4 w-4" /> Recall Ticket
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Tickets" value={queue.length} icon={ChefHat} accent="primary" index={0} />
        <StatCard label="Now Cooking" value={cooking} icon={Flame} accent="orange" index={1} />
        <StatCard label="Ready to Bump" value={readyCount} icon={CheckCircle2} accent="emerald" index={2} />
        <StatCard label="Avg Prep Time" value={`${avgTime}m`} icon={Timer} accent="amber" index={3} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const colOrders = queue.filter((o) => o.status === col.key)
          const Icon = col.icon
          return (
            <div key={col.key} className="space-y-3">
              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border border-t-2 border-border bg-card px-4 py-2.5",
                  col.accent,
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4 text-muted-foreground" /> {col.title}
                </span>
                <Badge variant="secondary">{colOrders.length}</Badge>
              </div>
              <div className="space-y-3">
                {colOrders.map((order, i) => (
                  <KitchenTicket key={order.id} order={order} index={i} />
                ))}
                {colOrders.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                    No tickets
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
