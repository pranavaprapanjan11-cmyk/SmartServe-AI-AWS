"use client"

import { motion } from "framer-motion"
import { HeartPulse } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/shared/animated-number"
import { dashboardStats } from "@/lib/mock-data"

const drivers = [
  { label: "Service speed", value: 96 },
  { label: "Guest sentiment", value: 92 },
  { label: "Kitchen flow", value: 89 },
]

export function HealthRing({ score = 88 }: { score?: number }) {
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  // Compute label based on score
  const getStatusLabel = (s: number) => {
    if (s >= 90) return "Excellent"
    if (s >= 75) return "Healthy"
    if (s >= 60) return "Needs Attention"
    return "Critical"
  }

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col items-center p-6 text-center">
        <div className="flex w-full items-center gap-2 text-left">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <HeartPulse className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">Restaurant Health</span>
        </div>

        <div className="relative my-4 flex h-40 w-40 items-center justify-center">
          <svg className="h-40 w-40 -rotate-90" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <motion.circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <AnimatedNumber
              value={score}
              duration={1400}
              className="font-serif text-4xl font-semibold text-foreground"
            />
            <span className="text-xs font-medium text-success">{getStatusLabel(score)}</span>
          </div>
        </div>

        <div className="w-full space-y-2.5">
          {drivers.map((d, i) => (
            <div key={d.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-medium text-foreground">{d.value}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${d.value}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.12, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
