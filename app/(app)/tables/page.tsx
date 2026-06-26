"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Grid3x3, Users, Clock, Sparkles, Map, LayoutGrid, CheckCircle2, AlertTriangle, User, Calendar, Trash2 } from "lucide-react"
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

export default function TablesPage() {
  const { token, sseActive, user } = useAuth()
  
  // Access control
  const isStaffOrManager = ["OWNER", "CHEF", "WAITER", "MANAGER", "SUPER_ADMIN"].includes(user?.role || "")

  // Data State
  const [tables, setTables] = useState<tableService.RestaurantTable[]>([])
  const [orders, setOrders] = useState<orderService.Order[]>([])
  const [activeSection, setActiveSection] = useState<string>("Main Hall")
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

  // Seating / Reservation Forms State
  const [showOperations, setShowOperations] = useState<boolean>(false)
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

      const targetX = targetTable.position_x + 35
      const targetY = targetTable.position_y + 35
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

  // Drag-and-drop positioning handler
  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!isEditMode || !isStaffOrManager) return
    e.preventDefault()

    const table = tables.find((t) => t.id === tableId)
    if (!table) return

    const startX = e.clientX
    const startY = e.clientY
    const initialTableX = table.position_x
    const initialTableY = table.position_y

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      
      setTables((prev) => prev.map((t) => {
        if (t.id === tableId) {
          // Clamp inside 800x600 floor bounds
          return {
            ...t,
            position_x: Math.max(0, Math.min(720, initialTableX + deltaX)),
            position_y: Math.max(0, Math.min(520, initialTableY + deltaY))
          }
        }
        return t
      }))
    }

    const handleMouseUp = async (upEvent: MouseEvent) => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)

      const finalTable = tables.find((t) => t.id === tableId)
      if (finalTable && token) {
        try {
          await tableService.updateTable(
            tableId,
            { position_x: finalTable.position_x, position_y: finalTable.position_y },
            token
          )
        } catch (err) {
          console.error("Failed to save coordinates:", err)
        }
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
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
              onClick={() => setIsEditMode(!isEditMode)}
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
              onClick={() => setActiveSection(sec)}
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
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 pointer-events-none opacity-[0.03]">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="border border-foreground" />
                  ))}
                </div>
              )}

              {/* Kitchen indicator in top corner */}
              <div className="absolute top-4 right-4 flex items-center gap-2 border border-border/80 bg-muted/40 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground select-none">
                🛎️ Kitchen Line
              </div>

              {filteredTables.map((table) => {
                const isSelected = selectedTableId === table.id
                
                return (
                  <motion.div
                    key={table.id}
                    onMouseDown={(e) => handleMouseDown(e, table.id)}
                    className={cn(
                      "absolute flex flex-col items-center justify-center p-3 select-none transition-shadow",
                      table.shape === "round" ? "rounded-full" : "rounded-2xl",
                      isEditMode ? "cursor-move ring-2 ring-primary/40 ring-dashed" : "cursor-pointer",
                      isSelected ? "ring-2 ring-primary bg-primary/10 shadow-lg" : "bg-card shadow-sm border border-border hover:border-primary/40"
                    )}
                    style={{
                      left: `${table.position_x}px`,
                      top: `${table.position_y}px`,
                      width: "80px",
                      height: "80px",
                    }}
                    onClick={() => {
                      if (!isEditMode) setSelectedTableId(table.id)
                    }}
                  >
                    {/* Status icons inside table */}
                    <div className="text-xl">
                      {table.status === "OCCUPIED" && "🍽️"}
                      {table.status === "RESERVED" && "🎗️"}
                      {table.status === "CLEANING" && "🧹"}
                      {table.status === "AVAILABLE" && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 block animate-pulse" />
                      )}
                    </div>
                    <span className="font-serif text-sm font-bold mt-1">T{table.table_number}</span>
                    <span className="text-[10px] text-muted-foreground">{table.capacity} pax</span>
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
          {selectedTable ? (
            <Card className="sticky top-6">
              <CardHeader className="border-b border-border/50 pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-serif">Table {selectedTable.table_number}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedTable.section} · Capacity: {selectedTable.capacity}</p>
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
                        />
                        <Input
                          placeholder="Phone Number"
                          value={reservedPhone}
                          onChange={(e) => setReservedPhone(e.target.value)}
                        />
                        <Input
                          type="datetime-local"
                          value={reservationTime}
                          onChange={(e) => setReservationTime(e.target.value)}
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
                      <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive/10" size="sm" onClick={handleCancelReservation}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {selectedTable.status === "OCCUPIED" && (
                  <div className="space-y-4">
                    {activeOrder ? (
                      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
                        <p className="font-semibold">Active Order #{activeOrder.id.substring(0,8)}</p>
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
                      <p className="font-semibold text-sm">Table is being cleared</p>
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
            <div className="flex h-48 items-center justify-center border border-dashed border-border rounded-2xl text-muted-foreground text-sm">
              Select a table from the floor layout to manage seating, orders, or reservations.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
