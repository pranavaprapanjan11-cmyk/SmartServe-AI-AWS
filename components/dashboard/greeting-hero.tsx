"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, TrendingUp, Flame } from "lucide-react"
import { AnimatedNumber } from "@/components/shared/animated-number"
import { LivePulse } from "@/components/shared/live-pulse"
import { currentUser, dashboardStats } from "@/lib/mock-data"

interface GreetingHeroProps {
  stats?: {
    revenue: number
    revenueDelta: number
    orders: number
    kitchenQueue: number
    healthScore: number
  } | null
  userName?: string
}

function getGreeting(hour: number) {
  if (hour < 5) return { text: "Late night service", sub: "The kitchen never sleeps" }
  if (hour < 12) return { text: "Good morning", sub: "Let's open strong today" }
  if (hour < 17) return { text: "Good afternoon", sub: "The lunch crowd is rolling in" }
  if (hour < 21) return { text: "Good evening", sub: "Dinner rush is heating up" }
  return { text: "Good evening", sub: "Winding down a great night" }
}

export function GreetingHero({ stats, userName }: GreetingHeroProps) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const hour = now?.getHours() ?? 19
  const greeting = getGreeting(hour)
  
  // Use props if available, otherwise fall back to mock data
  const nameToUse = userName || currentUser.name
  const firstName = nameToUse.split(" ")[0]
  
  const revenue = stats?.revenue ?? dashboardStats.revenue
  const revenueDelta = stats?.revenueDelta ?? dashboardStats.revenueDelta
  const orders = stats?.orders ?? dashboardStats.orders
  const kitchenQueue = stats?.kitchenQueue ?? dashboardStats.kitchenQueue
  const healthScore = stats?.healthScore ?? dashboardStats.healthScore

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="relative overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar p-6 text-sidebar-foreground shadow-soft md:p-8"
    >
      {/* Ambient warmth — copper + emerald glows that breathe like a live kitchen */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-copper/25 blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sidebar-accent/25 blur-3xl"
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.12, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-300">
              Open · Live service
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-white md:text-4xl">
            {greeting.text}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-zinc-300">
            {greeting.sub} at Saffron &amp; Sage.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sidebar-accent/15 px-3 py-1 text-xs font-medium text-sidebar-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {orders} orders served today
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-copper/15 px-3 py-1 text-xs font-medium text-copper">
              <Flame className="h-3.5 w-3.5" />
              {kitchenQueue} on the line right now
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-300">Today&apos;s Revenue</p>
          <div className="mt-1 flex items-end gap-3">
            <AnimatedNumber
              value={revenue}
              prefix="₹"
              duration={1600}
              className="font-serif text-4xl font-semibold text-white md:text-5xl"
            />
            <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-xs font-semibold text-success">
              <TrendingUp className="h-3 w-3" />+{revenueDelta}%
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">vs. same time last week</p>
        </div>
      </div>

      {/* Live service trace — the restaurant's heartbeat across the bottom of the hero */}
      <div className="relative mt-6 flex items-center gap-3 border-t border-sidebar-border/60 pt-4">
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
          Live service pulse
        </span>
        <LivePulse className="h-7 flex-1 text-sidebar-accent" speed={3.6} />
        <span className="shrink-0 text-[11px] font-medium text-sidebar-accent">{healthScore}% healthy</span>
      </div>
    </motion.div>
  )
}
