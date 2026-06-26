"use client"

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
    <Card>
      <CardHeader>
        <CardTitle>Live Activity</CardTitle>
        <CardDescription>Real-time floor events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {recentActivity.map((a) => {
          const Icon = iconMap[a.type as keyof typeof iconMap]
          return (
            <div key={a.id} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
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
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
