"use client"

import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { aiInsights } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const toneStyles = {
  info: { icon: TrendingUp, ring: "border-sky-500/30 bg-sky-500/5", chip: "bg-sky-500/10 text-sky-500" },
  warning: { icon: AlertTriangle, ring: "border-amber-500/30 bg-amber-500/5", chip: "bg-amber-500/10 text-amber-500" },
  success: { icon: Lightbulb, ring: "border-emerald-500/30 bg-emerald-500/5", chip: "bg-emerald-500/10 text-emerald-500" },
} as const

export function AIInsights() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {aiInsights.map((insight) => {
          const tone = toneStyles[insight.tone]
          const Icon = tone.icon
          return (
            <div key={insight.id} className={cn("rounded-xl border p-3.5", tone.ring)}>
              <div className="flex items-start gap-3">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tone.chip)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{insight.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{insight.body}</p>
                </div>
              </div>
            </div>
          )
        })}
        <Button variant="ghost" className="w-full justify-between text-primary hover:text-primary">
          Open AI Studio
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
