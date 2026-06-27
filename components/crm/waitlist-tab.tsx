"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Users, UserCheck, Plus, Search, Trash2, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import * as crmService from "@/lib/services/crmService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function WaitlistTab() {
  const { token } = useAuth()
  const [waitlist, setWaitlist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  // Form states
  const [isOpen, setIsOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [partySize, setPartySize] = useState<number>(2)
  const [estWait, setEstWait] = useState<number>(15)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchWaitlist = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const data = await crmService.getWaitlist(token)
      setWaitlist(data)
    } catch (err) {
      console.error("Failed to load waitlist:", err)
      toast.error("Failed to load waitlist queue.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchWaitlist(true)
  }, [fetchWaitlist])

  // Setup auto-refresh every 10 seconds to keep queues updated
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWaitlist(false)
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchWaitlist])

  const handleUpdateStatus = async (id: string, status: "SEATED" | "LEFT") => {
    if (!token) return
    try {
      await crmService.updateWaitlistStatus(id, status, token)
      toast.success(status === "SEATED" ? "Guest seated successfully!" : "Guest marked as left.")
      fetchWaitlist(false)
      // Broadcast table and reservations update
      window.dispatchEvent(new CustomEvent("tablesUpdated"))
      window.dispatchEvent(new CustomEvent("reservationsUpdated"))
    } catch (err) {
      console.error("Failed to update status:", err)
      toast.error("Failed to update queue status.")
    }
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!customerName || !phoneNumber || partySize <= 0) {
      toast.error("Please fill in name, phone number, and party size.")
      return
    }

    try {
      setSubmitting(true)
      await crmService.createWaitlistEntry({
        customer_name: customerName,
        phone_number: phoneNumber,
        party_size: partySize,
        estimated_wait_mins: estWait,
        notes: notes || undefined
      }, token)

      toast.success("Walk-in added to waitlist queue!")
      setCustomerName("")
      setPhoneNumber("")
      setPartySize(2)
      setEstWait(15)
      setNotes("")
      setIsOpen(false)
      fetchWaitlist(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || "Failed to add to waitlist.")
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = waitlist.filter((w) => {
    const q = query.toLowerCase()
    return (
      (w.customer_name || "").toLowerCase().includes(q) ||
      (w.phone_number || "").includes(q)
    )
  })

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase()
    if (s === "WAITING") return <Badge variant="warning" className="px-2 py-0.5">Waiting</Badge>
    if (s === "SEATED") return <Badge variant="success" className="px-2 py-0.5">Seated</Badge>
    return <Badge variant="secondary" className="px-2 py-0.5">Left</Badge>
  }

  const waitingCount = waitlist.filter(w => w.status === "WAITING").length
  const avgWaitTime = waitlist.filter(w => w.status === "WAITING").reduce((sum, w) => sum + (w.estimated_wait_mins || 0), 0) / (waitingCount || 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search waitlist..."
            className="pl-9"
          />
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1.5" /> Add Walk-in
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Waitlist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Name</label>
                <Input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Rahul Sharma" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <Input required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 9876543210" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Party Size</label>
                  <Input type="number" min="1" required value={partySize} onChange={(e) => setPartySize(parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Est. Wait (Mins)</label>
                  <Input type="number" min="0" required value={estWait} onChange={(e) => setEstWait(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Window booth preferred" />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>Add to Queue</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Waiting Queue</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{waitingCount} parties</h3>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg. Wait Time</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-500">{waitingCount > 0 ? Math.round(avgWaitTime) : 0} mins</h3>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Arrival Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Party Size</TableHead>
                <TableHead>Est. Wait</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((w, index) => {
                const arrival = w.created_at
                  ? new Date(w.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "--:--"
                return (
                  <TableRow key={w.id || index}>
                    <TableCell className="pl-6 font-medium text-xs">{arrival}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm">{w.customer_name || "Walk-in"}</div>
                      <div className="text-xs text-muted-foreground">{w.phone_number}</div>
                    </TableCell>
                    <TableCell className="font-bold text-xs">{w.party_size} pax</TableCell>
                    <TableCell className="text-xs font-medium text-amber-500">{w.estimated_wait_mins} mins</TableCell>
                    <TableCell>{getStatusBadge(w.status)}</TableCell>
                    <TableCell className="text-right pr-6">
                      {w.status === "WAITING" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={() => handleUpdateStatus(w.id, "SEATED")}
                          >
                            Seat
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => handleUpdateStatus(w.id, "LEFT")}
                          >
                            Left
                          </Button>
                        </div>
                      )}
                      {w.status !== "WAITING" && (
                        <span className="text-xs text-muted-foreground italic">Checked out</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm italic">
                    Waitlist is currently empty.
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
