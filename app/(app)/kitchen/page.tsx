"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Clock, Flame, CheckCircle2, ChefHat, Timer } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { orders, type Order } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const columns = [
  { key: "new", title: "Incoming", accent: "border-t-info", dot: "bg-info", icon: Clock },
  { key: "preparing", title: "Cooking", accent: "border-t-warning", dot: "bg-warning", icon: Flame },
  { key: "ready", title: "Ready", accent: "border-t-success", dot: "bg-success", icon: CheckCircle2 },
] as const

function urgency(elapsed: number) {
  if (elapsed >= 15) return "text-destructive"
  if (elapsed >= 8) return "text-warning"
  return "text-emerald-500"
}

// Soft rising steam, only over actively cooking tickets.
function Steam() {
  return (
    <div className="pointer-events-none absolute -top-1 right-4 flex gap-1" aria-hidden>
      {[0, 0.4, 0.8].map((delay, i) => (
        <span
          key={i}
          className="h-3 w-1 rounded-full bg-warning/50"
          style={{ animation: `steam-rise 2.4s ease-out ${delay}s infinite` }}
        />
      ))}
    </div>
  )
}

function KitchenTicket({ order, index }: { order: Order; index: number }) {
  const isCooking = order.status === "preparing"
  const isReady = order.status === "ready"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 280, damping: 26 }}
      whileHover={{ y: -3 }}
      className="relative"
    >
      {isCooking && <Steam />}
      <Card
        className={cn(
          "relative overflow-hidden transition-all",
          order.priority === "high" && "ring-1 ring-destructive/40",
          isReady && "shadow-glow-success ring-1 ring-success/50",
        )}
        style={isReady ? { animation: "glow-pulse 2.6s ease-in-out infinite" } : undefined}
      >
        {/* Cooking heat sweep */}
        {isCooking && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-warning to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-semibold">#{order.id}</span>
              <Badge variant="outline">{order.table}</Badge>
              {order.priority === "high" && (
                <Badge variant="danger" className="text-[10px]">
                  Rush
                </Badge>
              )}
            </div>
            <span className={cn("flex items-center gap-1 text-sm font-semibold", urgency(order.elapsedMin))}>
              <motion.span
                animate={isCooking ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                <Timer className="h-3.5 w-3.5" />
              </motion.span>
              {order.elapsedMin}m
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

          {isCooking && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-warning"
                initial={{ width: "20%" }}
                animate={{ width: ["20%", "85%"] }}
                transition={{ duration: 8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              />
            </div>
          )}

          <Button size="sm" variant={isReady ? "outline" : "default"} className="w-full">
            {order.status === "new" ? "Start Cooking" : isCooking ? "Mark Ready" : "Bump Ticket"}
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
        <StatCard label="Active Tickets" numericValue={queue.length} icon={ChefHat} accent="primary" index={0} />
        <StatCard label="Now Cooking" numericValue={cooking} icon={Flame} accent="orange" index={1} />
        <StatCard label="Ready to Bump" numericValue={readyCount} icon={CheckCircle2} accent="emerald" index={2} />
        <StatCard label="Avg Prep Time" numericValue={avgTime} suffix="m" icon={Timer} accent="amber" index={3} />
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
                  <span className="relative flex h-2 w-2">
                    {col.key === "preparing" && (
                      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", col.dot)} />
                    )}
                    <span className={cn("relative inline-flex h-2 w-2 rounded-full", col.dot)} />
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground" /> {col.title}
                </span>
                <Badge variant="secondary">{colOrders.length}</Badge>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {colOrders.map((order, i) => (
                    <KitchenTicket key={order.id} order={order} index={i} />
                  ))}
                </AnimatePresence>
                {colOrders.length === 0 && (
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                    <ChefHat className="h-6 w-6 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">All clear — the line is calm</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
