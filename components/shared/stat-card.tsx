"use client"

import { motion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/shared/animated-number"
import { cn } from "@/lib/utils"

export type StatAccent = "primary" | "copper" | "emerald" | "sky" | "orange" | "amber" | "info" | "warning"

export function StatCard({
  label,
  value,
  numericValue,
  prefix,
  suffix,
  decimals = 0,
  delta,
  icon: Icon,
  hint,
  accent = "primary",
  index = 0,
}: {
  label: string
  value?: string | number
  /** When provided, the value animates with a count-up effect. */
  numericValue?: number
  prefix?: string
  suffix?: string
  decimals?: number
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
  const glowMap: Record<StatAccent, string> = {
    primary: "group-hover:shadow-[0_0_28px_-10px_hsl(var(--primary)/0.5)]",
    copper: "group-hover:shadow-[0_0_28px_-10px_hsl(var(--copper)/0.5)]",
    emerald: "group-hover:shadow-[0_0_28px_-10px_rgba(16,185,129,0.5)]",
    sky: "group-hover:shadow-[0_0_28px_-10px_rgba(14,165,233,0.5)]",
    orange: "group-hover:shadow-[0_0_28px_-10px_rgba(249,115,22,0.5)]",
    amber: "group-hover:shadow-[0_0_28px_-10px_rgba(245,158,11,0.5)]",
    info: "group-hover:shadow-[0_0_28px_-10px_rgba(14,165,233,0.5)]",
    warning: "group-hover:shadow-[0_0_28px_-10px_rgba(245,158,11,0.5)]",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 260, damping: 22 }}
      whileHover={{ y: -4 }}
      className="group h-full"
    >
      <Card className={cn("h-full p-5 transition-all duration-300", glowMap[accent])}>
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
              accentMap[accent],
            )}
          >
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
        <p className="mt-4 font-serif text-2xl font-semibold tracking-tight">
          {typeof numericValue === "number" ? (
            <AnimatedNumber value={numericValue} prefix={prefix} suffix={suffix} decimals={decimals} />
          ) : (
            value
          )}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p>}
      </Card>
    </motion.div>
  )
}
