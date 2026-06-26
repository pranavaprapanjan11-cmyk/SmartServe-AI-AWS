"use client"

import { motion } from "framer-motion"
import { Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { hourlyOrders } from "@/lib/mock-data"

export function PeakHours() {
  const max = Math.max(...hourlyOrders.map((h) => h.orders))
  const peakIndex = hourlyOrders.findIndex((h) => h.orders === max)
  // Treat the current "live" hour as the 8p slot for the demo dataset.
  const liveIndex = hourlyOrders.findIndex((h) => h.hour === "8p")

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-copper/15 text-copper">
                <Activity className="h-4 w-4" />
              </span>
              Peak Hours
            </CardTitle>
            <CardDescription className="mt-1">Orders by hour · busiest at {hourlyOrders[peakIndex].hour}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-end gap-1.5">
          {hourlyOrders.map((h, i) => {
            const isLive = i === liveIndex
            const isPeak = i === peakIndex
            return (
              <div key={h.hour} className="group flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {h.orders}
                </span>
                <motion.div
                  className={`relative w-full rounded-t-md ${
                    isLive ? "bg-copper" : isPeak ? "bg-primary" : "bg-primary/25"
                  }`}
                  initial={{ height: 0 }}
                  animate={{ height: `${(h.orders / max) * 100}%` }}
                  transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
                >
                  {isLive && (
                    <motion.span
                      className="absolute inset-0 rounded-t-md bg-copper"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </motion.div>
                <span className={`text-[9px] ${isLive ? "font-semibold text-copper" : "text-muted-foreground"}`}>
                  {h.hour}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
