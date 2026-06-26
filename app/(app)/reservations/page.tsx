"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CalendarClock, Plus, Users, Phone, CheckCircle2, Hourglass } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { reservations, type Reservation } from "@/lib/mock-data"

const statusVariant: Record<Reservation["status"], "success" | "default" | "warning" | "danger"> = {
  confirmed: "success",
  seated: "default",
  waitlist: "warning",
  cancelled: "danger",
}

const filters = ["all", "confirmed", "seated", "waitlist", "cancelled"] as const

export default function ReservationsPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all")
  const filtered = reservations.filter((r) => filter === "all" || r.status === filter)

  const confirmed = reservations.filter((r) => r.status === "confirmed").length
  const seated = reservations.filter((r) => r.status === "seated").length
  const waitlist = reservations.filter((r) => r.status === "waitlist").length
  const covers = reservations.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.guests, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Reservations" description="Manage bookings, waitlist, and seating">
        <Button>
          <Plus className="h-4 w-4" /> New Reservation
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Confirmed" value={confirmed} icon={CheckCircle2} accent="emerald" index={0} />
        <StatCard label="Seated" value={seated} icon={Users} accent="primary" index={1} />
        <StatCard label="Waitlist" value={waitlist} icon={Hourglass} accent="amber" index={2} />
        <StatCard label="Total Covers" value={covers} icon={CalendarClock} accent="sky" index={3} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Today&apos;s Bookings</CardTitle>
            <CardDescription>{filtered.length} reservations</CardDescription>
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
                <TableHead>Party</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {r.guests}
                    </span>
                  </TableCell>
                  <TableCell>{r.time}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.table}</Badge>
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      {r.status === "waitlist" ? "Seat" : "Manage"}
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
