"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ClipboardList, CreditCard, CalendarClock, Boxes, ChefHat, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import * as aiOperationsService from "@/lib/services/aiOperationsService"
import { cn } from "@/lib/utils"

const iconMap = {
  // Order types
  ORDER_CREATED: ClipboardList,
  ORDER_SERVED: ChefHat,
  ORDER_COMPLETED: ChefHat,
  ORDER_CANCELLED: ClipboardList,
  // Payment types
  PAYMENT_RECEIVED: CreditCard,
  PAYMENT_COMPLETED: CreditCard,
  SPLIT_PAYMENT: CreditCard,
  INVOICE_GENERATED: CreditCard,
  // Table / Reservation types
  TABLE_RESERVED: CalendarClock,
  TABLE_OCCUPIED: CalendarClock,
  TABLE_CLEANING: CalendarClock,
  TABLE_AVAILABLE: CalendarClock,
  // Inventory types
  LOW_STOCK_ALERT: Boxes,
  INVENTORY_DEDUCTED: Boxes
} as const

const toneMap = {
  ORDER_CREATED: "bg-primary/10 text-primary",
  ORDER_SERVED: "bg-orange-500/10 text-orange-500",
  ORDER_COMPLETED: "bg-orange-500/10 text-orange-500",
  ORDER_CANCELLED: "bg-red-500/10 text-red-500",
  PAYMENT_RECEIVED: "bg-emerald-500/10 text-emerald-500",
  PAYMENT_COMPLETED: "bg-emerald-500/10 text-emerald-500",
  SPLIT_PAYMENT: "bg-emerald-500/10 text-emerald-500",
  INVOICE_GENERATED: "bg-emerald-500/10 text-emerald-500",
  TABLE_RESERVED: "bg-sky-500/10 text-sky-500",
  TABLE_OCCUPIED: "bg-sky-500/10 text-sky-500",
  TABLE_CLEANING: "bg-amber-500/10 text-amber-500",
  TABLE_AVAILABLE: "bg-emerald-500/10 text-emerald-500",
  LOW_STOCK_ALERT: "bg-amber-500/10 text-amber-500",
  INVENTORY_DEDUCTED: "bg-amber-500/10 text-amber-500"
} as const

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}

export function ActivityFeed() {
  const { token } = useAuth()
  const [events, setEvents] = useState<aiOperationsService.ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    if (!token) return
    try {
      const data = await aiOperationsService.fetchOperationsEvents(token)
      const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setEvents(sorted.slice(0, 8)) // Keep top 8 latest events
    } catch (err) {
      console.error("Failed to load operations events:", err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Reload events in real-time when updates are fired via SSE
  useEffect(() => {
    const handleUpdate = () => loadEvents()
    window.addEventListener("ordersUpdated", handleUpdate)
    window.addEventListener("tablesUpdated", handleUpdate)
    window.addEventListener("reservationsUpdated", handleUpdate)
    window.addEventListener("billingUpdated", handleUpdate)
    window.addEventListener("liveActivityEvent", handleUpdate)
    
    return () => {
      window.removeEventListener("ordersUpdated", handleUpdate)
      window.removeEventListener("tablesUpdated", handleUpdate)
      window.removeEventListener("reservationsUpdated", handleUpdate)
      window.removeEventListener("billingUpdated", handleUpdate)
      window.removeEventListener("liveActivityEvent", handleUpdate)
    }
  }, [loadEvents])

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Activity Stream</CardTitle>
            <CardDescription>Real-time operations event logger</CardDescription>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading && events.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Syncing live activity stream...
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No recent activity logged.
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {events.map((a, i) => {
                const Icon = iconMap[a.event_type as keyof typeof iconMap] || Info
                const tone = toneMap[a.event_type as keyof typeof toneMap] || "bg-muted text-muted-foreground"
                
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className={cn(
                      "flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50",
                      i === 0 && "bg-primary/[0.04]",
                    )}
                  >
                    <span className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      tone
                    )}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-foreground font-medium">{a.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeTime(a.created_at)}</p>
                    </div>
                    {i === 0 && (
                      <span className="mt-1 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        New
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
