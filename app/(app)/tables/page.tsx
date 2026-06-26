"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Grid3x3, Users, Clock, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { tables, type RestaurantTable } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const statusStyles: Record<RestaurantTable["status"], { ring: string; dot: string; label: string }> = {
  available: { ring: "border-emerald-500/40 bg-emerald-500/5", dot: "bg-emerald-500", label: "Available" },
  occupied: { ring: "border-primary/40 bg-primary/5", dot: "bg-primary", label: "Occupied" },
  reserved: { ring: "border-sky-500/40 bg-sky-500/5", dot: "bg-sky-500", label: "Reserved" },
  cleaning: { ring: "border-amber-500/40 bg-amber-500/5", dot: "bg-amber-500", label: "Cleaning" },
}

const legend = ["available", "occupied", "reserved", "cleaning"] as const

export default function TablesPage() {
  const [selected, setSelected] = useState<string | null>(null)

  const occupied = tables.filter((t) => t.status === "occupied").length
  const available = tables.filter((t) => t.status === "available").length
  const reserved = tables.filter((t) => t.status === "reserved").length
  const totalGuests = tables.reduce((s, t) => s + (t.guests ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Table Management" description="Live floor plan and table status">
        <Button variant="outline">Floor Editor</Button>
        <Button>Seat Guests</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Occupied" value={`${occupied}/${tables.length}`} icon={Grid3x3} accent="primary" index={0} />
        <StatCard label="Available" value={available} icon={Grid3x3} accent="emerald" index={1} />
        <StatCard label="Reserved" value={reserved} icon={Clock} accent="sky" index={2} />
        <StatCard label="Guests Seated" value={totalGuests} icon={Users} accent="copper" index={3} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {legend.map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-2.5 w-2.5 rounded-full", statusStyles[s].dot)} />
            {statusStyles[s].label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {tables.map((table, i) => {
          const style = statusStyles[table.status]
          const isSelected = selected === table.id
          return (
            <motion.button
              key={table.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(isSelected ? null : table.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition-shadow hover:shadow-md",
                style.ring,
                isSelected && "ring-2 ring-primary",
              )}
            >
              <span className="flex items-center gap-1.5 font-serif text-lg font-semibold">
                <span className={cn("h-2 w-2 rounded-full", style.dot)} />
                {table.number}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> {table.guests ?? 0}/{table.seats}
              </span>
              <Badge
                variant={
                  table.status === "available"
                    ? "success"
                    : table.status === "occupied"
                      ? "default"
                      : table.status === "reserved"
                        ? "info"
                        : "warning"
                }
              >
                {style.label}
              </Badge>
              {table.server && <span className="text-[11px] text-muted-foreground">{table.server}</span>}
              {table.since && <span className="text-[11px] text-muted-foreground">{table.since}</span>}
            </motion.button>
          )
        })}
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium">AI Floor Suggestion</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Table 5 has been in cleaning for 12 minutes — assign it to the waitlist party of 4 (Priya Kapoor) to cut
              their wait by ~15 minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
