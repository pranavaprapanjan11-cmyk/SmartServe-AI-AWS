"use client"

import { motion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type StatAccent = "primary" | "copper" | "emerald" | "sky" | "orange" | "amber" | "info" | "warning"

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  hint,
  accent = "primary",
  index = 0,
}: {
  label: string
  value: string | number
  delta?: number
  icon: LucideIcon
  hint?: string
  accent?: StatAccent
  index?: number
}) {
  const accentMap: Record<StatAccent, string> = {
    primary: "bg-primary/10 text-primary",
    copper: "bg-copper/12 text-copper",
    emerald: "bg-emerald-500/10 text-emerald-500",
    sky: "bg-sky-500/10 text-sky-500",
    orange: "bg-orange-500/10 text-orange-500",
    amber: "bg-amber-500/10 text-amber-500",
    info: "bg-sky-500/10 text-sky-500",
    warning: "bg-amber-500/10 text-amber-500",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3 }}
    >
      <Card className="p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accentMap[accent])}>
            <Icon className="h-5 w-5" />
          </div>
          {typeof delta === "number" && (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                delta >= 0 ? "bg-emerald-500/12 text-emerald-500" : "bg-destructive/12 text-destructive",
              )}
            >
              {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <p className="mt-4 font-serif text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p>}
      </Card>
    </motion.div>
  )
}
