"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarClock, Plus, Users, Phone, CheckCircle2, Hourglass, Calendar, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import * as crmService from "@/lib/services/crmService"
import { toast } from "sonner"

interface ReservationRecord {
  id: string
  name: string
  guests: number
  time: string // displayed format or ISO
  reservation_time: string
  table_number?: number
  phone: string
  status: "confirmed" | "seated" | "waitlist" | "cancelled"
}

const statusVariant: Record<string, "success" | "default" | "warning" | "destructive" | "secondary"> = {
  confirmed: "success",
  seated: "default",
  waitlist: "warning",
  cancelled: "destructive",
}

const filters = ["all", "confirmed", "seated", "waitlist", "cancelled"] as const

export default function ReservationsPage() {
  const { token } = useAuth()
  
  // Data State
  const [reservations, setReservations] = useState<ReservationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<(typeof filters)[number]>("all")

  // Modal / Form State
  const [isOpen, setIsOpen] = useState(false)
  const [guestName, setGuestName] = useState("")
  const [guestCount, setGuestCount] = useState<number>(2)
  const [phone, setPhone] = useState("")
  const [time, setTime] = useState("")
  const [tableNum, setTableNum] = useState("")
  const [isWaitlist, setIsWaitlist] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadReservations = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const data = await crmService.getReservations(token)
      // Map keys if needed to match UI fields
      const normalized: ReservationRecord[] = data.map((r: any) => ({
        id: r.id,
        name: r.reserved_for || r.name || "Guest",
        guests: Number(r.guest_count || r.guests || 2),
        time: r.reservation_time ? new Date(r.reservation_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        reservation_time: r.reservation_time,
        phone: r.reserved_phone || r.phone || "",
        table_number: r.table_number || r.table || undefined,
        status: (r.status || "confirmed").toLowerCase() as any,
      }))
      setReservations(normalized)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load reservations.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadReservations(true)
  }, [loadReservations])

  // Live SSE listener
  useEffect(() => {
    const handleUpdate = () => loadReservations(false)
    window.addEventListener("reservationsUpdated", handleUpdate)
    return () => {
      window.removeEventListener("reservationsUpdated", handleUpdate)
    }
  }, [loadReservations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !guestName || !phone || !time) return
    try {
      setSubmitting(true)
      const payload = {
        reserved_for: guestName,
        reserved_phone: phone,
        guest_count: guestCount,
        reservation_time: new Date(time).toISOString(),
        table_number: tableNum ? parseInt(tableNum) : undefined,
        status: isWaitlist ? "WAITLIST" : "CONFIRMED"
      }
      
      await crmService.createReservation(payload, token)
      toast.success(isWaitlist ? "Added to waitlist" : "Reservation confirmed!")
      
      // Clear
      setGuestName("")
      setGuestCount(2)
      setPhone("")
      setTime("")
      setTableNum("")
      setIsWaitlist(false)
      setIsOpen(false)
      
      window.dispatchEvent(new CustomEvent("reservationsUpdated"))
      loadReservations(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || "Failed to create reservation.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!token) return
    try {
      await crmService.updateReservationStatus(id, newStatus, token)
      toast.success(`Reservation status updated to ${newStatus}`)
      window.dispatchEvent(new CustomEvent("reservationsUpdated"))
      loadReservations(false)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to update status.")
    }
  }

  const filtered = useMemo(() => {
    return reservations.filter((r) => filter === "all" || r.status === filter)
  }, [reservations, filter])

  const confirmedCount = reservations.filter((r) => r.status === "confirmed").length
  const seatedCount = reservations.filter((r) => r.status === "seated").length
  const waitlistCount = reservations.filter((r) => r.status === "waitlist").length
  const coversCount = reservations.filter((r) => r.status !== "cancelled").reduce((sum, r) => sum + r.guests, 0)

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reservations" description="Manage table bookings, waitlists, and guest seatings">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1.5" /> New Booking
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Reservation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guest Name</label>
                <Input required value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="e.g. Rohan Sen" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Party Size</label>
                  <Input type="number" required min="1" max="30" value={guestCount} onChange={(e) => setGuestCount(parseInt(e.target.value) || 2)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Table Number (Optional)</label>
                  <Input type="number" value={tableNum} onChange={(e) => setTableNum(e.target.value)} placeholder="e.g. 5" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 99999 88888" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking Date & Time</label>
                <Input type="datetime-local" required value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="waitlist_check"
                  checked={isWaitlist}
                  onChange={(e) => setIsWaitlist(e.target.checked)}
                  className="rounded border-border bg-muted/40 text-primary"
                />
                <label htmlFor="waitlist_check" className="text-sm font-medium text-foreground cursor-pointer select-none">
                  Place in Waitlist queue (no table pre-assignment)
                </label>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Confirming..." : "Confirm Booking"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Confirmed" value={confirmedCount} icon={CheckCircle2} accent="emerald" index={0} />
        <StatCard label="Seated" value={seatedCount} icon={Users} accent="primary" index={1} />
        <StatCard label="Waitlist" value={waitlistCount} icon={Hourglass} accent="amber" index={2} />
        <StatCard label="Total Covers" value={coversCount} icon={CalendarClock} accent="sky" index={3} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Bookings Agenda</CardTitle>
            <CardDescription>{filtered.length} reservations listed</CardDescription>
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as (typeof filters)[number])}>
            <TabsList className="flex-wrap">
              {filters.map((f) => (
                <TabsTrigger key={f} value={f} className="capitalize">
                  {f}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Party Size</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={r.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-semibold">{r.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {r.guests}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(r.reservation_time).toLocaleDateString()} at {r.time}
                    </span>
                  </TableCell>
                  <TableCell>
                    {r.table_number ? (
                      <Badge variant="outline">Table {r.table_number}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {r.phone}
                    </span>
                  </TableCell>
                  <TableCell>
                    {/* @ts-ignore */}
                    <Badge variant={statusVariant[r.status]} className="capitalize">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1 whitespace-nowrap">
                    {r.status === "waitlist" && (
                      <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(r.id, "CONFIRMED")}>
                        Confirm
                      </Button>
                    )}
                    {r.status === "confirmed" && (
                      <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(r.id, "SEATED")}>
                        Seat Guest
                      </Button>
                    )}
                    {r.status !== "seated" && r.status !== "cancelled" && (
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleUpdateStatus(r.id, "CANCELLED")}>
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No reservations found in this category.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
