"use client"

import { motion } from "framer-motion"
import { IndianRupee, ShoppingBag, ChefHat, CalendarClock, Grid3x3, Boxes, Users, HeartPulse } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { GreetingHero } from "@/components/dashboard/greeting-hero"
import { HealthRing } from "@/components/dashboard/health-ring"
import { PeakHours } from "@/components/dashboard/peak-hours"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { CategoryMix } from "@/components/dashboard/category-mix"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { AIInsights } from "@/components/dashboard/ai-insights"
import { dashboardStats } from "@/lib/mock-data"

export default function DashboardPage() {
  const s = dashboardStats
  return (
    <div className="space-y-6">
      <GreetingHero />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Today's Revenue"
          numericValue={s.revenue / 1000}
          prefix="₹"
          suffix="k"
          decimals={1}
          delta={s.revenueDelta}
          icon={IndianRupee}
          accent="primary"
          index={0}
        />
        <StatCard
          label="Orders"
          numericValue={s.orders}
          delta={s.ordersDelta}
          icon={ShoppingBag}
          accent="sky"
          index={1}
        />
        <StatCard
          label="Kitchen Queue"
          numericValue={s.kitchenQueue}
          icon={ChefHat}
          accent="orange"
          hint="active tickets"
          index={2}
        />
        <StatCard
          label="Reservations"
          numericValue={s.reservations}
          icon={CalendarClock}
          accent="sky"
          hint="booked today"
          index={3}
        />
        <StatCard
          label="Tables Occupied"
          value={`${s.tablesOccupied}/${s.tablesTotal}`}
          icon={Grid3x3}
          accent="emerald"
          index={4}
        />
        <StatCard
          label="Inventory Alerts"
          numericValue={s.inventoryAlerts}
          icon={Boxes}
          accent="amber"
          hint="needs attention"
          index={5}
        />
        <StatCard
          label="Staff On Shift"
          value={`${s.employeesActive}/${s.employeesTotal}`}
          icon={Users}
          accent="primary"
          index={6}
        />
        <StatCard
          label="Health Score"
          numericValue={s.healthScore}
          suffix="%"
          icon={HeartPulse}
          accent="emerald"
          index={7}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <HealthRing />
        <RevenueChart />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PeakHours />
        <CategoryMix />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AIInsights />
        <ActivityFeed />
      </div>
    </div>
  )
}
