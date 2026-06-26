"use client"

import { motion } from "framer-motion"
import { ClipboardList, CreditCard, CalendarClock, Boxes, ChefHat } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { recentActivity } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const iconMap = {
  order: ClipboardList,
  payment: CreditCard,
  reservation: CalendarClock,
  inventory: Boxes,
  kitchen: ChefHat,
} as const

const toneMap = {
  order: "bg-primary/10 text-primary",
  payment: "bg-emerald-500/10 text-emerald-500",
  reservation: "bg-sky-500/10 text-sky-500",
  inventory: "bg-amber-500/10 text-amber-500",
  kitchen: "bg-orange-500/10 text-orange-500",
} as const

export function ActivityFeed() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Activity</CardTitle>
            <CardDescription>Real-time floor events</CardDescription>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {recentActivity.map((a, i) => {
          const Icon = iconMap[a.type as keyof typeof iconMap]
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 24 }}
              className={cn(
                "flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50",
                i === 0 && "bg-primary/[0.04]",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  toneMap[a.type as keyof typeof toneMap],
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-foreground">{a.text}</p>
                <p className="text-xs text-muted-foreground">{a.time}</p>
              </div>
              {i === 0 && (
                <span className="mt-1 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  New
                </span>
              )}
            </motion.div>
          )
        })}
      </CardContent>
    </Card>
  )
}
