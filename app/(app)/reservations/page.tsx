"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarClock, Plus, Users, Phone, CheckCircle2, Hourglass, Calendar, Edit2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import * as crmService from "@/lib/services/crmService"
import * as tableService from "@/lib/services/tableService"
import { toast } from "sonner"
import WaitlistTab from "@/components/crm/waitlist-tab"

interface ReservationRecord {
  id: string
  customer_id: string
  name: string
  guests: number
  time: string // e.g. "19:00"
  reservation_date: string // e.g. "2026-06-27"
  reservation_time: string // e.g. "19:00:00"
  phone: string
  table_number?: number
  requested_table?: string
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show"
  notes?: string
}

const statusVariant: Record<string, "success" | "default" | "warning" | "danger" | "secondary"> = {
  pending: "warning",
  confirmed: "success",
  seated: "default",
  completed: "secondary",
  cancelled: "danger",
  no_show: "danger",
}

const filters = ["all", "pending", "confirmed", "seated", "completed", "cancelled", "no_show"] as const

export default function ReservationsPage() {
  const { token } = useAuth()
  const [mainTab, setMainTab] = useState<"bookings" | "waitlist">("bookings")
  
  // Data State
  const [reservations, setReservations] = useState<ReservationRecord[]>([])
  const [tables, setTables] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<(typeof filters)[number]>("all")

  // Modal / Form State
  const [isOpen, setIsOpen] = useState(false)
  const [editingRes, setEditingRes] = useState<ReservationRecord | null>(null)
  const [guestName, setGuestName] = useState("")
  const [guestCount, setGuestCount] = useState<number>(2)
  const [phone, setPhone] = useState("")
  const [time, setTime] = useState("")
  const [selectedTableId, setSelectedTableId] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const [resData, custData, tableData] = await Promise.all([
        crmService.getReservations(token),
        crmService.getCustomers(token),
        tableService.getTables(token)
      ])
      setCustomers(custData)
      setTables(tableData)

      const normalized: ReservationRecord[] = resData.map((r: any) => {
        const matchingTable = tableData.find((t: any) => t.id === r.requested_table);
        
        let dateStr = "";
        if (r.reservation_date) {
          if (typeof r.reservation_date === 'string') {
            dateStr = r.reservation_date.split('T')[0];
          } else {
            const d = new Date(r.reservation_date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
          }
        }

        return {
          id: r.id,
          customer_id: r.customer_id,
          name: r.customer_name || "Guest",
          guests: Number(r.guest_count || 2),
          time: r.reservation_time ? r.reservation_time.substring(0, 5) : "",
          reservation_date: dateStr,
          reservation_time: r.reservation_time || "",
          phone: r.phone_number || "",
          table_number: matchingTable ? matchingTable.table_number : undefined,
          requested_table: r.requested_table || undefined,
          status: (r.status || "confirmed").toLowerCase() as any,
          notes: r.notes || "",
        };
      })
      setReservations(normalized)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load reservations.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData(true)
  }, [loadData])

  // Live SSE listener
  useEffect(() => {
    const handleUpdate = () => loadData(false)
    window.addEventListener("reservationsUpdated", handleUpdate)
    return () => {
      window.removeEventListener("reservationsUpdated", handleUpdate)
    }
  }, [loadData])

  const openNewBooking = () => {
    setEditingRes(null)
    setGuestName("")
    setGuestCount(2)
    setPhone("")
    
    // Set local datetime string format YYYY-MM-DDTHH:MM
    const localNow = new Date()
    const tzOffset = localNow.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(localNow.getTime() - tzOffset)).toISOString().slice(0, 16);
    setTime(localISOTime)
    
    setSelectedTableId("")
    setNotes("")
    setIsOpen(true)
  }

  const openEditBooking = (r: ReservationRecord) => {
    setEditingRes(r)
    setGuestName(r.name)
    setGuestCount(r.guests)
    setPhone(r.phone)
    setTime(`${r.reservation_date}T${r.time}`)
    setSelectedTableId(r.requested_table || "")
    setNotes(r.notes || "")
    setIsOpen(true)
  }

  const handlePhoneChange = (val: string) => {
    setPhone(val)
    const found = customers.find(c => c.phone_number && (c.phone_number.includes(val) || val.includes(c.phone_number)))
    if (found) {
      setGuestName(found.name || '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !guestName || !phone || !time) return
    try {
      setSubmitting(true)
      
      let customerId = editingRes ? editingRes.customer_id : null;
      if (!editingRes) {
        // Find or create customer
        const existing = customers.find(c => c.phone_number && c.phone_number.trim() === phone.trim());
        if (existing) {
          customerId = existing.id;
        } else {
          const newCust = await crmService.createCustomer({
            name: guestName,
            phone_number: phone
          }, token);
          customerId = newCust.id;
        }
      }

      const [datePart, timePart] = time.split('T')
      const payload = {
        customer_id: customerId,
        reservation_date: datePart,
        reservation_time: timePart + ":00",
        guest_count: guestCount,
        requested_table: selectedTableId || null,
        notes: notes || null
      }
      
      if (editingRes) {
        await crmService.updateReservation(editingRes.id, payload, token)
        toast.success("Reservation updated!")
      } else {
        await crmService.createReservation(payload, token)
        toast.success("Reservation confirmed!")
      }
      
      setIsOpen(false)
      window.dispatchEvent(new CustomEvent("reservationsUpdated"))
      loadData(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Failed to save reservation.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string, requestedTable?: string) => {
    if (!token) return
    try {
      await crmService.updateReservationStatus(id, { status: newStatus.toUpperCase(), requested_table: requestedTable || null }, token)
      toast.success(`Reservation status updated to ${newStatus}`)
      window.dispatchEvent(new CustomEvent("reservationsUpdated"))
      loadData(false)
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
  const pendingCount = reservations.filter((r) => r.status === "pending").length
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
      <PageHeader 
        title={mainTab === "bookings" ? "Reservations" : "Waitlist Queue"} 
        description="Manage table bookings, walk-ins, and guest seatings"
      >
        {mainTab === "bookings" && (
          <Button onClick={openNewBooking}>
            <Plus className="h-4 w-4 mr-1.5" /> New Booking
          </Button>
        )}
      </PageHeader>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">Reservations Book</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-6 m-0">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Confirmed" value={confirmedCount} icon={CheckCircle2} accent="emerald" index={0} />
        <StatCard label="Seated" value={seatedCount} icon={Users} accent="primary" index={1} />
        <StatCard label="Pending" value={pendingCount} icon={Hourglass} accent="amber" index={2} />
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
              {filtered.map((r) => (
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
                      {r.reservation_date} at {r.time}
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
                    <Badge variant={statusVariant[r.status]} className="capitalize">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1 whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => openEditBooking(r)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    {r.status === "pending" && (
                      <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(r.id, "CONFIRMED")}>
                        Confirm
                      </Button>
                    )}
                    {r.status === "confirmed" && (
                      <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(r.id, "SEATED", r.requested_table)}>
                        Seat Guest
                      </Button>
                    )}
                    {r.status !== "seated" && r.status !== "completed" && r.status !== "cancelled" && (
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
        </TabsContent>

        <TabsContent value="waitlist" className="m-0">
          <WaitlistTab />
        </TabsContent>
      </Tabs>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRes ? "Edit Reservation" : "New Reservation"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
              <Input required value={phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="e.g. +91 99999 88888" />
            </div>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign Table (Optional)</label>
                <select 
                  value={selectedTableId} 
                  onChange={(e) => setSelectedTableId(e.target.value)} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Table (None)</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.table_number} ({t.capacity} Pax) - {t.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking Date & Time</label>
              <Input type="datetime-local" required value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes (Optional)</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Allergy details, window seat" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : (editingRes ? "Save Changes" : "Confirm Booking")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
