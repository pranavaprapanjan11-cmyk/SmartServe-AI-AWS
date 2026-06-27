"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Grid3x3, Users, Clock, Sparkles, Map, LayoutGrid, CheckCircle2, 
  AlertTriangle, User, Calendar, Trash2, Plus, RotateCw, Move, Check, HelpCircle
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import * as tableService from "@/lib/services/tableService"
import * as orderService from "@/lib/services/orderService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ActiveAnimation {
  id: string
  type: "waiter" | "food" | "payment"
  tableNumber: number
  startX: number
  startY: number
  endX: number
  endY: number
}

const SECTIONS = ["Main Hall", "VIP", "Outdoor", "Family Area", "Rooftop"]

const PRESETS = [
  { label: "Square Table (2 Pax)", shape: "square", capacity: 2, width: 80, height: 80 },
  { label: "Round Table (4 Pax)", shape: "round", capacity: 4, width: 80, height: 80 },
  { label: "Booth (6 Pax)", shape: "booth", capacity: 6, width: 120, height: 80 },
  { label: "Family Table (8 Pax)", shape: "family", capacity: 8, width: 140, height: 90 },
  { label: "Outdoor Table (4 Pax)", shape: "outdoor", capacity: 4, width: 85, height: 85 },
  { label: "Bar Seating (1 Pax)", shape: "bar", capacity: 1, width: 65, height: 65 },
]

function findNextAvailablePosition(existingTables: any[]) {
  const cols = [40, 180, 320, 460, 600, 740]
  const rows = [40, 180, 320, 460]
  
  for (const y of rows) {
    for (const x of cols) {
      const margin = 20
      const w = 80
      const h = 80
      const collides = existingTables.some(t => {
        const tW = t.width || 80
        const tH = t.height || 80
        return (
          x < Number(t.position_x) + tW + margin &&
          x + w + margin > Number(t.position_x) &&
          y < Number(t.position_y) + tH + margin &&
          y + h + margin > Number(t.position_y)
        )
      })
      if (!collides) {
        return { position_x: x, position_y: y }
      }
    }
  }
  return { position_x: 80, position_y: 80 }
}

export default function TablesPage() {
  const { token, sseActive, user } = useAuth()
  
  // Access control
  const isStaffOrManager = ["OWNER", "CHEF", "WAITER", "MANAGER", "SUPER_ADMIN", "RESTAURANT_OWNER"].includes(user?.role || "")

  // Data State
  const [tables, setTables] = useState<tableService.RestaurantTable[]>([])
  const [orders, setOrders] = useState<orderService.Order[]>([])
  const [activeSection, setActiveSection] = useState<string>("Main Hall")
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

  // Seating / Reservation Forms State
  const [guestCount, setGuestCount] = useState<number>(2)
  const [reservedFor, setReservedFor] = useState<string>("")
  const [reservedPhone, setReservedPhone] = useState<string>("")
  const [reservationTime, setReservationTime] = useState<string>("")
  const [viewMode, setViewMode] = useState<"floor" | "grid">("floor")

  // Live animations
  const [animations, setAnimations] = useState<ActiveAnimation[]>([])
  const floorRef = useRef<HTMLDivElement>(null)

  const loadFloorPlanData = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const [tablesData, ordersData] = await Promise.all([
        tableService.getTables(token),
        orderService.getOrders(token)
      ])
      setTables(tablesData)
      setOrders(ordersData)
    } catch (err: any) {
      console.error("Failed to load floor plan:", err)
      toast.error("Failed to fetch floor plan tables.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadFloorPlanData(true)
  }, [])

  // Listen to SSE / updates
  useEffect(() => {
    const handleUpdate = () => loadFloorPlanData(false)
    window.addEventListener("tablesUpdated", handleUpdate)
    window.addEventListener("ordersUpdated", handleUpdate)
    
    // Live floating animations
    const handleGlobalActivity = (e: any) => {
      const { type, data } = e.detail || {}
      const tableNum = Number(data?.tableNumber || data?.table_number || 0)
      if (!tableNum) return

      // Find coordinate of the target table
      const targetTable = tables.find((t) => t.table_number === tableNum)
      if (!targetTable) return

      const targetX = targetTable.position_x + ((targetTable.width || 80) / 2)
      const targetY = targetTable.position_y + ((targetTable.height || 80) / 2)
      const animId = Math.random().toString(36).substring(2, 9)

      // Simulated kitchen is top right (e.g. 700, 30)
      if (type === "orderCreated") {
        setAnimations((prev) => [...prev, {
          id: animId,
          type: "waiter",
          tableNumber: tableNum,
          startX: targetX,
          startY: targetY,
          endX: 700,
          endY: 30
        }])
        setTimeout(() => setAnimations((prev) => prev.filter((a) => a.id !== animId)), 2500)
      } else if (type === "orderServed") {
        setAnimations((prev) => [...prev, {
          id: animId,
          type: "food",
          tableNumber: tableNum,
          startX: 700,
          startY: 30,
          endX: targetX,
          endY: targetY
        }])
        setTimeout(() => setAnimations((prev) => prev.filter((a) => a.id !== animId)), 2500)
      } else if (type === "paymentSuccess") {
        setAnimations((prev) => [...prev, {
          id: animId,
          type: "payment",
          tableNumber: tableNum,
          startX: targetX,
          startY: targetY,
          endX: targetX,
          endY: targetY
        }])
        setTimeout(() => setAnimations((prev) => prev.filter((a) => a.id !== animId)), 2000)
      }

      loadFloorPlanData(false)
    }

    window.addEventListener("liveActivityEvent", handleGlobalActivity)

    return () => {
      window.removeEventListener("tablesUpdated", handleUpdate)
      window.removeEventListener("ordersUpdated", handleUpdate)
      window.removeEventListener("liveActivityEvent", handleGlobalActivity)
    }
  }, [loadFloorPlanData, tables])

  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || null
  }, [tables, selectedTableId])

  const activeOrder = useMemo(() => {
    if (!selectedTable) return null
    return orders.find(o => o.table_number === selectedTable.table_number && o.status !== "PAID") || null
  }, [selectedTable, orders])

  // Drag-and-drop positioning handler with collision checking and state sync
  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!isEditMode || !isStaffOrManager) return
    e.preventDefault()
    e.stopPropagation()

    const table = tables.find((t) => t.id === tableId)
    if (!table) return

    const startX = e.clientX
    const startY = e.clientY
    const initialTableX = Number(table.position_x)
    const initialTableY = Number(table.position_y)
    const width = table.width || 80
    const height = table.height || 80

    let currentX = initialTableX
    let currentY = initialTableY

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      
      currentX = Math.max(0, Math.min(800 - width, initialTableX + deltaX))
      currentY = Math.max(0, Math.min(580 - height, initialTableY + deltaY))

      setTables((prev) => prev.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            position_x: currentX,
            position_y: currentY
          }
        }
        return t
      }))
    }

    const handleMouseUp = async (upEvent: MouseEvent) => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)

      // Bounding box collision checker
      const hasCollision = tables.some(t => {
        if (t.id === tableId) return false
        const tW = t.width || 80
        const tH = t.height || 80
        const margin = 10 // collision buffer threshold
        return (
          currentX < Number(t.position_x) + tW - margin &&
          currentX + width - margin > Number(t.position_x) &&
          currentY < Number(t.position_y) + tH - margin &&
          currentY + height - margin > Number(t.position_y)
        )
      })

      if (hasCollision) {
        toast.error("Collision detected! Reverting table to its original position.")
        setTables((prev) => prev.map((t) => {
          if (t.id === tableId) {
            return {
              ...t,
              position_x: initialTableX,
              position_y: initialTableY
            }
          }
          return t
        }))
        return
      }

      if (token) {
        try {
          await tableService.updateTable(
            tableId,
            { position_x: currentX, position_y: currentY },
            token
          )
          toast.success("Table position persisted.")
        } catch (err) {
          console.error("Failed to save coordinates:", err)
          toast.error("Failed to save table position.")
          // Revert on API error
          setTables((prev) => prev.map((t) => {
            if (t.id === tableId) {
              return {
                ...t,
                position_x: initialTableX,
                position_y: initialTableY
              }
            }
            return t
          }))
        }
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Update properties of a table (optimistic update)
  const handleUpdateTableProperty = async (id: string, updates: Partial<tableService.RestaurantTable>) => {
    if (!token) return
    try {
      // Optimistic local state update
      setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
      await tableService.updateTable(id, updates, token)
      window.dispatchEvent(new CustomEvent("tablesUpdated"))
    } catch (err) {
      console.error(err)
      toast.error("Failed to update table property")
      loadFloorPlanData(false)
    }
  }

  // Add Table using a preset with automatic grid placement calculations
  const handleAddTable = async (preset: typeof PRESETS[0]) => {
    if (!token) return
    try {
      const nextNum = Math.max(...tables.map(t => t.table_number), 0) + 1
      const { position_x, position_y } = findNextAvailablePosition(tables)
      const newTable = await tableService.createTable({
        table_number: nextNum,
        capacity: preset.capacity,
        shape: preset.shape,
        section: activeSection,
        position_x,
        position_y,
        width: preset.width,
        height: preset.height,
        rotation: 0
      } as any, token)
      
      setTables(prev => [...prev, newTable])
      setSelectedTableId(newTable.id)
      toast.success(`Added ${preset.label} T${nextNum}`)
      window.dispatchEvent(new CustomEvent("tablesUpdated"))
    } catch (err) {
      console.error(err)
      toast.error("Failed to add new table")
    }
  }

  // Delete table
  const handleDeleteTable = async (id: string) => {
    if (!token) return
    if (!window.confirm("Are you sure you want to delete this table?")) return
    try {
      await tableService.deleteTable(id, token)
      setTables(prev => prev.filter(t => t.id !== id))
      setSelectedTableId(null)
      toast.success("Table deleted successfully")
      window.dispatchEvent(new CustomEvent("tablesUpdated"))
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete table")
      loadFloorPlanData(false)
    }
  }

  // Seating guest
  const handleSeatGuest = async () => {
    if (!selectedTable || !token) return
    try {
      // Transition table to occupied
      await tableService.updateTable(selectedTable.id, { status: tableService.TableStatus.OCCUPIED }, token)
      toast.success(`Guests seated at Table ${selectedTable.table_number}. Creating order...`)
      
      // Dispatch live activity and redirect to create order
      const activityEvent = new CustomEvent("liveActivityEvent", {
        detail: { type: "tableOccupied", data: { tableNumber: selectedTable.table_number } }
      })
      window.dispatchEvent(activityEvent)
      
      window.dispatchEvent(new CustomEvent("tablesUpdated"))
      loadFloorPlanData(false)
      
      // Redirect to POS with table pre-selected
      window.location.href = `/orders/create?table=${selectedTable.table_number}`
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to seat guests")
    }
  }

  // Reserving table
  const handleReserveTable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTable || !token || !reservedFor || !reservedPhone || !reservationTime) {
      toast.error("Please fill all reservation fields")
      return
    }

    try {
      const payload: tableService.ReservationPayload = {
        reserved_for: reservedFor,
        reserved_phone: reservedPhone,
        reservation_time: new Date(reservationTime).toISOString(),
      }
      await tableService.reserveTable(selectedTable.id, payload, token)
      toast.success(`Table ${selectedTable.table_number} reserved successfully`)
      
      setReservedFor("")
      setReservedPhone("")
      setReservationTime("")
      
      window.dispatchEvent(new CustomEvent("tablesUpdated"))
      loadFloorPlanData(false)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to reserve table")
    }
  }

  // Cancel reservation
  const handleCancelReservation = async () => {
    if (!selectedTable || !token) return
    if (!window.confirm("Cancel this reservation?")) return
    try {
      await tableService.cancelReservation(selectedTable.id, token)
      toast.success("Reservation cancelled")
      window.dispatchEvent(new CustomEvent("tablesUpdated"))
      loadFloorPlanData(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to cancel reservation")
    }
  }

  // Clear / Bump cleaning table to free
  const handleClearTable = async () => {
    if (!selectedTable || !token) return
    try {
      await tableService.updateTable(selectedTable.id, { status: tableService.TableStatus.AVAILABLE }, token)
      toast.success(`Table ${selectedTable.table_number} is now Available`)
      
      const activityEvent = new CustomEvent("liveActivityEvent", {
        detail: { type: "tableAvailable", data: { tableNumber: selectedTable.table_number } }
      })
      window.dispatchEvent(activityEvent)

      window.dispatchEvent(new CustomEvent("tablesUpdated"))
      loadFloorPlanData(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to clear table")
    }
  }

  // Section filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => t.section === activeSection)
  }, [tables, activeSection])

  // Stat variables
  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED").length
  const availableCount = tables.filter((t) => t.status === "AVAILABLE").length
  const reservedCount = tables.filter((t) => t.status === "RESERVED").length
  const seatedGuests = useMemo(() => {
    return orders.filter(o => o.status !== "PAID").reduce((sum, o) => sum + (o.guest_count || 0), 0)
  }, [orders])

  const getStatusBadgeVariant = (status: tableService.TableStatus) => {
    switch (status) {
      case "AVAILABLE": return "success"
      case "OCCUPIED": return "default"
      case "RESERVED": return "info"
      case "CLEANING": return "warning"
      default: return "outline"
    }
  }

  if (loading && tables.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Floor Layout" description="Live workspace, guest seating, and table twin tracker" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted/20 border-border/60">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
        <div className="h-[450px] w-full rounded-3xl border border-dashed border-border/80 animate-pulse bg-muted/10 flex items-center justify-center text-muted-foreground text-sm">
          Loading restaurant floor layout...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Floor Layout" description="Live workspace, guest seating, and table twin tracker">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "floor" ? "grid" : "floor")}
          >
            {viewMode === "floor" ? <LayoutGrid className="h-4 w-4" /> : <Map className="h-4 w-4" />}
          </Button>

          {isStaffOrManager && viewMode === "floor" && (
            <Button
              variant={isEditMode ? "default" : "outline"}
              onClick={() => {
                setIsEditMode(!isEditMode)
                setSelectedTableId(null)
              }}
            >
              {isEditMode ? "Exit Layout Editor" : "Floor Layout Editor"}
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Occupied Tables" value={`${occupiedCount}/${tables.length}`} icon={Grid3x3} accent="primary" index={0} />
        <StatCard label="Available Tables" value={availableCount} icon={CheckCircle2} accent="emerald" index={1} />
        <StatCard label="Reserved" value={reservedCount} icon={Clock} accent="sky" index={2} />
        <StatCard label="Seated Guests" value={seatedGuests} icon={Users} accent="copper" index={3} />
      </div>

      {/* Sections and Legends */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((sec) => (
            <Button
              key={sec}
              variant={activeSection === sec ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveSection(sec)
                setSelectedTableId(null)
              }}
            >
              {sec}
            </Button>
          ))}
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground border border-border/40 p-2 rounded-xl bg-card">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Free</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Occupied</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" /> Reserved</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Cleaning</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Workspace Floor/Grid Area (Left) */}
        <div>
          {viewMode === "floor" ? (
            <div
              ref={floorRef}
              className="relative w-full h-[580px] rounded-3xl border border-border bg-card/50 overflow-hidden shadow-inner bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/30 via-background to-background"
            >
              {/* Layout Helper Grid */}
              {isEditMode && (
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-8 pointer-events-none opacity-[0.03]">
                  {Array.from({ length: 80 }).map((_, i) => (
                    <div key={i} className="border border-foreground" />
                  ))}
                </div>
              )}

              {/* Kitchen indicator in top corner */}
              <div className="absolute top-4 right-4 flex items-center gap-2 border border-border/80 bg-muted/40 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground select-none z-10">
                🛎️ Kitchen Line
              </div>

              {filteredTables.map((table) => {
                const isSelected = selectedTableId === table.id
                const width = table.width || 80
                const height = table.height || 80
                const rotation = table.rotation || 0
                
                // Waiter service check: check if order is ready
                const tOrder = orders.find(o => o.table_number === table.table_number && o.status !== "PAID")
                const hasReadyFood = tOrder?.status === "READY" || tOrder?.status === "SERVED"
                
                // Set shapes classes
                const isCircular = ["round", "outdoor", "bar"].includes(table.shape || "")
                const shapeStyle = isCircular ? "rounded-full" : "rounded-2xl"

                // Glow style based on status
                let glowClass = ""
                if (table.status === "OCCUPIED") {
                  glowClass = "shadow-[0_0_18px_rgba(239,68,68,0.4)] border-red-500/50 bg-gradient-to-br from-card to-red-500/5"
                } else if (table.status === "RESERVED") {
                  glowClass = "shadow-[0_0_18px_rgba(59,130,246,0.4)] border-blue-500/50 bg-gradient-to-br from-card to-blue-500/5"
                } else if (table.status === "CLEANING") {
                  glowClass = "shadow-[0_0_18px_rgba(245,158,11,0.4)] border-amber-500/50 bg-gradient-to-br from-card to-amber-500/5"
                } else {
                  glowClass = "border-emerald-500/30 bg-gradient-to-br from-card to-emerald-500/[0.02]"
                }

                return (
                  <motion.div
                    key={table.id}
                    layout
                    transition={{ type: "spring", stiffness: 220, damping: 24 }}
                    onMouseDown={(e) => handleMouseDown(e, table.id)}
                    className={cn(
                      "absolute flex flex-col items-center justify-center p-2 select-none border transition-colors",
                      shapeStyle,
                      glowClass,
                      isEditMode ? "cursor-move ring-2 ring-primary/30 ring-dashed" : "cursor-pointer",
                      isSelected ? "ring-2 ring-primary bg-primary/[0.08] shadow-md border-primary" : "hover:border-primary/40"
                    )}
                    style={{
                      left: `${table.position_x}px`,
                      top: `${table.position_y}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                      transform: `rotate(${rotation}deg)`
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTableId(table.id)
                    }}
                  >
                    {/* Waiter service indicator badge */}
                    {table.status === "OCCUPIED" && hasReadyFood && (
                      <span className="absolute -top-2.5 -right-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold shadow-lg animate-bounce border border-white">
                        🛎️
                      </span>
                    )}

                    {/* Status icons inside table */}
                    <div className="text-xl">
                      {table.status === "OCCUPIED" && "🍽️"}
                      {table.status === "RESERVED" && "🎗️"}
                      {table.status === "CLEANING" && "🧹"}
                      {table.status === "AVAILABLE" && (
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block animate-pulse" />
                      )}
                    </div>
                    
                    <span className="font-serif text-sm font-bold mt-1 text-foreground">
                      T{table.table_number}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {table.capacity} pax
                    </span>

                    {/* Visual indicators for orientation inside layout editor */}
                    {isEditMode && rotation > 0 && (
                      <span className="absolute bottom-1 right-1 text-[8px] text-muted-foreground/60">
                        {rotation}°
                      </span>
                    )}
                  </motion.div>
                )
              })}

              {/* Floating animations overlay */}
              <AnimatePresence>
                {animations.map((anim) => (
                  <motion.div
                    key={anim.id}
                    initial={{ x: anim.startX - 15, y: anim.startY - 15, opacity: 0, scale: 0.5 }}
                    animate={{ x: anim.endX - 15, y: anim.endY - 15, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.2, ease: "easeInOut" }}
                    className="absolute pointer-events-none z-30 flex items-center justify-center h-8 w-8 rounded-full bg-slate-900 border border-primary/40 shadow-xl"
                  >
                    <span className="text-sm">
                      {anim.type === "waiter" ? "🏃👔" : anim.type === "food" ? "🛎️🍕" : "💳💵"}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filteredTables.map((table) => {
                const isSelected = selectedTableId === table.id
                return (
                  <Card
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    className={cn(
                      "cursor-pointer hover:border-primary/40 transition-colors",
                      isSelected && "ring-2 ring-primary bg-primary/5"
                    )}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                      <div className="flex w-full items-center justify-between">
                        <span className="font-serif text-lg font-bold">Table {table.table_number}</span>
                        {/* @ts-ignore */}
                        <Badge variant={getStatusBadgeVariant(table.status)}>
                          {table.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Capacity: {table.capacity} Seats</div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar Operations Panel (Right) */}
        <div>
          {isEditMode ? (
            <Card className="sticky top-6 border-dashed border-primary/50">
              <CardHeader className="bg-primary/5 pb-3">
                <CardTitle className="text-lg font-serif flex items-center gap-2 text-primary">
                  <Plus className="h-5 w-5" /> Floor Editor Dashboard
                </CardTitle>
                <p className="text-xs text-muted-foreground">Create, position, resize, and configure layout elements</p>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-5">
                {/* 1. Add Table Presets */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Preset Table</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        className="text-xs flex items-center justify-start gap-2 h-9 p-2 hover:bg-primary/5 hover:border-primary"
                        onClick={() => handleAddTable(preset)}
                      >
                        <span className="text-sm">
                          {preset.shape === "round" && "⭕"}
                          {preset.shape === "square" && "⬛"}
                          {preset.shape === "booth" && "🛋️"}
                          {preset.shape === "family" && "👪"}
                          {preset.shape === "outdoor" && "⛱️"}
                          {preset.shape === "bar" && "🍹"}
                        </span>
                        <div className="text-left leading-tight">
                          <p className="font-medium truncate text-foreground">{preset.label.split(" (")[0]}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 2. Selected Table Properties Editor */}
                {selectedTable ? (
                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Configure Table properties</h4>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:bg-destructive/10" 
                        onClick={() => handleDeleteTable(selectedTable.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Table Number</label>
                        <Input
                          type="number"
                          value={selectedTable.table_number}
                          onChange={(e) => handleUpdateTableProperty(selectedTable.id, { table_number: parseInt(e.target.value) || selectedTable.table_number })}
                          className="h-8 text-xs mt-1 text-foreground bg-background border-border"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Capacity (Seats)</label>
                        <Input
                          type="number"
                          value={selectedTable.capacity}
                          onChange={(e) => handleUpdateTableProperty(selectedTable.id, { capacity: parseInt(e.target.value) || selectedTable.capacity })}
                          className="h-8 text-xs mt-1 text-foreground bg-background border-border"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Shape</label>
                        <select
                          value={selectedTable.shape || "square"}
                          onChange={(e) => handleUpdateTableProperty(selectedTable.id, { shape: e.target.value })}
                          className="w-full h-8 text-xs mt-1 border border-input rounded-md bg-background px-3 py-1.5 text-foreground border-border"
                        >
                          <option value="square">Square</option>
                          <option value="round">Round</option>
                          <option value="booth">Booth</option>
                          <option value="family">Family Table</option>
                          <option value="outdoor">Outdoor</option>
                          <option value="bar">Bar Seating</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Zone / Section</label>
                        <select
                          value={selectedTable.section || "Main Hall"}
                          onChange={(e) => handleUpdateTableProperty(selectedTable.id, { section: e.target.value })}
                          className="w-full h-8 text-xs mt-1 border border-input rounded-md bg-background px-3 py-1.5 text-foreground border-border"
                        >
                          {SECTIONS.map((sec) => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Width / Height / Rotation settings */}
                    <div className="space-y-3 pt-2 border-t border-border/50">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase">
                          <span>Width ({selectedTable.width || 80}px)</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="200"
                          value={selectedTable.width || 80}
                          onChange={(e) => handleUpdateTableProperty(selectedTable.id, { width: parseInt(e.target.value) })}
                          className="w-full accent-primary bg-secondary rounded-lg appearance-none h-1.5 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase">
                          <span>Height ({selectedTable.height || 80}px)</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="200"
                          value={selectedTable.height || 80}
                          onChange={(e) => handleUpdateTableProperty(selectedTable.id, { height: parseInt(e.target.value) })}
                          className="w-full accent-primary bg-secondary rounded-lg appearance-none h-1.5 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase">
                          <span>Rotation ({selectedTable.rotation || 0}°)</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="15"
                          value={selectedTable.rotation || 0}
                          onChange={(e) => handleUpdateTableProperty(selectedTable.id, { rotation: parseInt(e.target.value) })}
                          className="w-full accent-primary bg-secondary rounded-lg appearance-none h-1.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-36 items-center justify-center border border-dashed border-border rounded-2xl text-muted-foreground text-xs text-center p-4">
                    Select any table on the floor map to resize, rotate, or modify its properties.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div>
              {selectedTable ? (
                <Card className="sticky top-6">
                  <CardHeader className="border-b border-border/50 pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-serif">Table {selectedTable.table_number}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedTable.section} · Capacity: {selectedTable.capacity} Pax</p>
                    </div>
                    {/* @ts-ignore */}
                    <Badge variant={getStatusBadgeVariant(selectedTable.status)}>
                      {selectedTable.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    
                    {/* Status operations */}
                    {selectedTable.status === "AVAILABLE" && (
                      <div className="space-y-4">
                        <Button className="w-full" onClick={handleSeatGuest}>
                          Seat Guests (Walk-in)
                        </Button>
                        
                        <form onSubmit={handleReserveTable} className="border-t border-border pt-4 space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Reservation</p>
                          <div className="space-y-2">
                            <Input
                              placeholder="Reserved Name"
                              value={reservedFor}
                              onChange={(e) => setReservedFor(e.target.value)}
                              className="text-foreground bg-background border-border"
                            />
                            <Input
                              placeholder="Phone Number"
                              value={reservedPhone}
                              onChange={(e) => setReservedPhone(e.target.value)}
                              className="text-foreground bg-background border-border"
                            />
                            <Input
                              type="datetime-local"
                              value={reservationTime}
                              onChange={(e) => setReservationTime(e.target.value)}
                              className="text-foreground bg-background border-border"
                            />
                          </div>
                          <Button type="submit" variant="secondary" className="w-full">
                            Reserve Table
                          </Button>
                        </form>
                      </div>
                    )}

                    {selectedTable.status === "RESERVED" && (
                      <div className="space-y-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm">
                        <div className="flex items-start gap-2">
                          <User className="h-4.5 w-4.5 text-primary shrink-0" />
                          <div>
                            <p className="font-semibold text-foreground">{selectedTable.reserved_for}</p>
                            <p className="text-xs text-muted-foreground">Phone: {selectedTable.reserved_phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 border-t border-border/40 pt-2 text-xs text-muted-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          {selectedTable.reservation_time ? new Date(selectedTable.reservation_time).toLocaleString() : ""}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-border/40">
                          <Button className="flex-1" size="sm" onClick={handleSeatGuest}>
                            Arrived & Seat
                          </Button>
                          <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive/10 border-border" size="sm" onClick={handleCancelReservation}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedTable.status === "OCCUPIED" && (
                      <div className="space-y-4">
                        {activeOrder ? (
                          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
                            <p className="font-semibold text-foreground">Active Order #{activeOrder.id.substring(0,8)}</p>
                            <p className="text-xs text-muted-foreground">Guests: {activeOrder.guest_count} | Waiter: {activeOrder.waiter_name || "Assigned"}</p>
                            <p className="text-xs text-muted-foreground">Status: <Badge className="text-[10px] py-0.5">{activeOrder.status}</Badge></p>
                            <div className="flex gap-2 pt-2 border-t border-border/40">
                              <Button className="flex-1" size="sm" asChild>
                                <Link href={`/orders/${activeOrder.id}`}>Details</Link>
                              </Button>
                              <Button className="flex-1 font-semibold" variant="secondary" size="sm" asChild>
                                <Link href="/billing">Settle Bill</Link>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground italic">No active order found for this table.</p>
                            <Button className="w-full" asChild>
                              <Link href={`/orders/create?table=${selectedTable.table_number}`}>Create Order</Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedTable.status === "CLEANING" && (
                      <div className="space-y-3 text-center py-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                        <Sparkles className="mx-auto h-8 w-8 text-amber-500 animate-pulse" />
                        <div>
                          <p className="font-semibold text-sm text-foreground">Table is being cleared</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Mark available when cleaning completes.</p>
                        </div>
                        <Button className="w-full mt-2" onClick={handleClearTable}>
                          Mark Available
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="flex h-48 items-center justify-center border border-dashed border-border rounded-2xl text-muted-foreground text-sm text-center p-4">
                  Select a table from the floor layout to manage seating, orders, or reservations.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
