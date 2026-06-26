"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Flame, CheckCircle2, ChefHat, Timer, RotateCcw, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"
import * as kitchenService from "@/lib/services/kitchenService"
import * as inventoryService from "@/lib/services/inventoryService"
import * as orderService from "@/lib/services/orderService"
import { cn } from "@/lib/utils"

const COLUMNS = [
  { key: "NEW", title: "Incoming", accent: "border-t-info", dot: "bg-info", icon: Clock },
  { key: "COOKING", title: "Cooking", accent: "border-t-warning", dot: "bg-warning", icon: Flame },
  { key: "READY", title: "Ready", accent: "border-t-success", dot: "bg-success", icon: CheckCircle2 },
] as const

function Steam() {
  return (
    <div className="pointer-events-none absolute -top-1 right-4 flex gap-1" aria-hidden>
      {[0, 0.4, 0.8].map((delay, i) => (
        <span
          key={i}
          className="h-3 w-1 rounded-full bg-warning/50 animate-steam-rise"
          style={{
            animation: `steam-rise 2.4s ease-out ${delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

const playNotificationChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const playTone = (time: number, freq: number, duration: number) => {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, time)
      
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.2, time + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
      
      osc.start(time)
      osc.stop(time + duration)
    }
    
    const now = audioCtx.currentTime
    playTone(now, 587.33, 0.4) // D5
    playTone(now + 0.15, 880.00, 0.5) // A5
  } catch (e) {
    console.error("AudioContext blocked or failed:", e)
  }
}

interface KitchenTicketProps {
  order: orderService.Order
  index: number
  columnKey: "NEW" | "COOKING" | "READY"
  isHighlighted: boolean
  onAction: (order: orderService.Order) => void
  onRemake: (orderId: string, itemId: string, name: string) => void
}

function KitchenTicket({ order, index, columnKey, isHighlighted, onAction, onRemake }: KitchenTicketProps) {
  const isCooking = columnKey === "COOKING"
  const isReady = columnKey === "READY"
  
  const elapsed = kitchenService.elapsedMinutes(order)
  
  const urgencyColor = () => {
    if (elapsed >= 15) return "text-destructive"
    if (elapsed >= 8) return "text-warning"
    return "text-emerald-500"
  }

  const getActionButtonText = () => {
    if (columnKey === "NEW") return "Start Cooking"
    if (columnKey === "COOKING") return "Mark Ready"
    return "Mark Served"
  }

  const getCardBorderClass = () => {
    if (isReady) return "border-t-success ring-1 ring-success/30 shadow-glow-success"
    if (isCooking) return "border-t-warning"
    return "border-t-info"
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={isHighlighted ? {
        opacity: 1,
        y: 0,
        borderColor: ["rgba(56, 189, 248, 0.2)", "rgba(56, 189, 248, 0.9)", "rgba(56, 189, 248, 0.2)"],
        boxShadow: [
          "0 0 15px rgba(56,189,248,0.05)",
          "0 0 25px rgba(56,189,248,0.35)",
          "0 0 15px rgba(56,189,248,0.05)"
        ],
        transition: { repeat: Infinity, duration: 1.5 }
      } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {isCooking && <Steam />}
      <Card
        className={cn(
          "relative overflow-hidden border-t-4 transition-all duration-300",
          getCardBorderClass()
        )}
        style={isReady ? { animation: "glow-pulse 2.6s ease-in-out infinite" } : undefined}
      >
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
              <span className="font-serif text-base font-semibold">#{order.id.substring(0, 8)}</span>
              <Badge variant="outline">Table {order.table_number}</Badge>
            </div>
            <span className={cn("flex items-center gap-1 text-sm font-semibold", urgencyColor())}>
              <motion.span
                animate={isCooking ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                <Timer className="h-3.5 w-3.5" />
              </motion.span>
              {elapsed}m
            </span>
          </div>

          <ul className="space-y-1.5 border-t border-border/40 pt-2">
            {order.items?.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-2 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-primary">{item.quantity}×</span>
                  <span className="text-foreground">{item.name || `Item ${item.menu_item_id.substring(0,4)}`}</span>
                </div>
                {(columnKey === "COOKING" || columnKey === "READY") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onRemake(order.id, item.id, item.name || "item")}
                  >
                    Remake
                  </Button>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
            <Button
              size="sm"
              variant={isReady ? "outline" : "default"}
              className="w-full h-9 font-medium"
              onClick={() => onAction(order)}
            >
              {getActionButtonText()}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function KitchenPage() {
  const { token, sseActive, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [newOrders, setNewOrders] = useState<orderService.Order[]>([])
  const [preparing, setPreparing] = useState<orderService.Order[]>([])
  const [ready, setReady] = useState<orderService.Order[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<string[]>([])

  const prevOrderIdsRef = useRef<Set<string>>(new Set())
  const isFirstLoadRef = useRef<boolean>(true)

  const loadOrders = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const res = await kitchenService.getKitchenOrders(token)
      
      const incomingNewOrders: orderService.Order[] = res.newOrders || []
      const incomingPreparing: orderService.Order[] = res.preparing || []
      const incomingReady: orderService.Order[] = res.ready || []

      const currentIncomingIds = new Set([
        ...incomingNewOrders.map((o) => o.id),
        ...incomingPreparing.map((o) => o.id),
        ...incomingReady.map((o) => o.id)
      ])

      // Check for newly arrived orders to play chime (skip on first load)
      if (!isFirstLoadRef.current) {
        const newlyArrivedIds: string[] = []
        incomingNewOrders.forEach((o) => {
          if (!prevOrderIdsRef.current.has(o.id)) {
            newlyArrivedIds.push(o.id)
          }
        })

        if (newlyArrivedIds.length > 0) {
          playNotificationChime()
          setHighlightedOrderIds((prev) => [...prev, ...newlyArrivedIds])
          setTimeout(() => {
            setHighlightedOrderIds((prev) => prev.filter((id) => !newlyArrivedIds.includes(id)))
          }, 8000)
        }
      } else {
        isFirstLoadRef.current = false
      }

      prevOrderIdsRef.current = currentIncomingIds

      setNewOrders(incomingNewOrders)
      setPreparing(incomingPreparing)
      setReady(incomingReady)
      
      const now = new Date()
      setLastUpdated(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    } catch (err) {
      console.error("Failed to load kitchen tickets:", err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadOrders(true)

    const onUpdate = () => loadOrders(false)

    const handleOrderCreated = (e: Event) => {
      const customEvent = e as CustomEvent
      const order = customEvent.detail
      if (!order) return

      console.log("Kitchen incoming order event:", order)

      // Verify workspace matches
      const userWsId = user?.workspace_id
      const orderWsId = order.workspace_id || order.workspaceId
      if (!userWsId || !orderWsId || userWsId !== orderWsId) {
        return
      }

      playNotificationChime()
      
      setHighlightedOrderIds((prev) => {
        if (prev.includes(order.id)) return prev
        return [...prev, order.id]
      })
      setTimeout(() => {
        setHighlightedOrderIds((prev) => prev.filter((id) => id !== order.id))
      }, 8000)

      loadOrders(false)
    }

    const handleOrderUpdated = (e: Event) => {
      const customEvent = e as CustomEvent
      const order = customEvent.detail
      if (!order) return

      // Verify workspace matches
      const userWsId = user?.workspace_id
      const orderWsId = order.workspace_id || order.workspaceId
      if (!userWsId || !orderWsId || userWsId !== orderWsId) return

      loadOrders(false)
    }

    window.addEventListener("ordersUpdated", onUpdate)
    window.addEventListener("order_created", handleOrderCreated)
    window.addEventListener("order_updated", handleOrderUpdated)
    window.addEventListener("order_completed", onUpdate)
    window.addEventListener("order_cancelled", onUpdate)

    let iv: any = null
    if (!sseActive) {
      // 4-second polling fallback
      iv = setInterval(() => loadOrders(false), 4000)
    }

    return () => {
      window.removeEventListener("ordersUpdated", onUpdate)
      window.removeEventListener("order_created", handleOrderCreated)
      window.removeEventListener("order_updated", handleOrderUpdated)
      window.removeEventListener("order_completed", onUpdate)
      window.removeEventListener("order_cancelled", onUpdate)
      if (iv) clearInterval(iv)
    }
  }, [loadOrders, sseActive, user])

  const handleAction = async (order: orderService.Order) => {
    if (!token) return
    try {
      if (order.status === orderService.OrderStatus.NEW) {
        await kitchenService.startCooking(order.id, token)
        toast.info(`Started cooking Order #${order.id.substring(0, 8)}`)
      } else if (order.status === orderService.OrderStatus.PREPARING || order.status === orderService.OrderStatus.SENT_TO_KITCHEN) {
        await kitchenService.markReady(order.id, token)
        toast.success(`Order #${order.id.substring(0, 8)} is ready!`)
      } else if (order.status === orderService.OrderStatus.READY) {
        await kitchenService.markServed(order.id, token)
        toast.success(`Order #${order.id.substring(0, 8)} marked served.`)
      }

      window.dispatchEvent(new CustomEvent("ordersUpdated"))
      loadOrders(false)
    } catch (err: any) {
      console.error("Failed to advance order status:", err)
      toast.error("Failed to advance order status.")
    }
  }

  const handleRemake = async (orderId: string, itemId: string, itemName: string) => {
    if (!token) return
    const reason = window.prompt(`Enter waste reason for remaking "${itemName}":`)
    if (!reason || !reason.trim()) return

    try {
      setLoading(true)
      await inventoryService.remakeOrderItem(orderId, itemId, reason.trim(), token)
      window.dispatchEvent(new CustomEvent("ordersUpdated"))
      loadOrders(false)
      toast.success(`Dish remake requested. Wastage recorded.`)
    } catch (err: any) {
      console.error("Failed to request remake:", err)
      toast.error("Error remaking item: " + (err?.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const allOrders = [...newOrders, ...preparing, ...ready]
  const cookingCount = preparing.length
  const readyCount = ready.length
  const avgTime = kitchenService.averagePrepMinutes(allOrders)
  const delayedCount = allOrders.filter((o) => kitchenService.elapsedMinutes(o) > 15).length

  return (
    <div className="space-y-6">
      <PageHeader title="Kitchen Display" description="Real-time ticket board for chef and cook lines">
        <div className="flex items-center gap-3">
          {lastUpdated && <span className="text-xs text-muted-foreground">Updated: {lastUpdated}</span>}
          <Button variant="outline" size="sm" onClick={() => loadOrders(true)}>
            Refresh Board
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Tickets" value={allOrders.length} icon={ChefHat} accent="primary" index={0} />
        <StatCard label="Now Cooking" value={cookingCount} icon={Flame} accent="orange" index={1} />
        <StatCard label="Ready to Bump" value={readyCount} icon={CheckCircle2} accent="emerald" index={2} />
        <StatCard label="Delayed (>15m)" value={delayedCount} icon={AlertTriangle} accent="amber" index={3} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const isPreparingCol = col.key === "COOKING"
          const list = col.key === "NEW" ? newOrders : isPreparingCol ? preparing : ready
          const Icon = col.icon

          return (
            <div key={col.key} className="space-y-4 flex flex-col h-full min-h-[500px]">
              <div className={cn(
                "flex items-center justify-between rounded-xl border border-t-4 border-border bg-card px-4 py-3 shadow-sm",
                col.accent
              )}>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="relative flex h-2.5 w-2.5">
                    {isPreparingCol && list.length > 0 && (
                      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", col.dot)} />
                    )}
                    <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", col.dot)} />
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground" /> {col.title}
                </span>
                <Badge variant="secondary">{list.length}</Badge>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                <AnimatePresence mode="popLayout">
                  {list.map((order, i) => (
                    <KitchenTicket
                      key={order.id}
                      order={order}
                      index={i}
                      columnKey={col.key}
                      isHighlighted={highlightedOrderIds.includes(order.id)}
                      onAction={handleAction}
                      onRemake={handleRemake}
                    />
                  ))}
                </AnimatePresence>
                {list.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
                    <ChefHat className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground font-medium">All clear on this line</p>
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
