"use client"

import { motion } from "framer-motion"
import { IndianRupee, ShoppingBag, ChefHat, CalendarClock, Grid3x3, Boxes, Users, HeartPulse } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { CategoryMix } from "@/components/dashboard/category-mix"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { AIInsights } from "@/components/dashboard/ai-insights"
import { Button } from "@/components/ui/button"
import { dashboardStats } from "@/lib/mock-data"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const s = dashboardStats
  return (
    <div className="space-y-6">
      <PageHeader title="Command Center" description="Saffron & Sage · Live operations overview">
        <Button variant="outline">Export Report</Button>
        <Button>New Order</Button>
      </PageHeader>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
      >
        <motion.div variants={item}>
          <StatCard
            label="Today's Revenue"
            value={`₹${(s.revenue / 1000).toFixed(1)}k`}
            delta={s.revenueDelta}
            icon={IndianRupee}
            accent="primary"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Orders" value={s.orders} delta={s.ordersDelta} icon={ShoppingBag} accent="sky" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Kitchen Queue" value={s.kitchenQueue} icon={ChefHat} accent="orange" hint="active tickets" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            label="Reservations"
            value={s.reservations}
            icon={CalendarClock}
            accent="sky"
            hint="booked today"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            label="Tables Occupied"
            value={`${s.tablesOccupied}/${s.tablesTotal}`}
            icon={Grid3x3}
            accent="emerald"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            label="Inventory Alerts"
            value={s.inventoryAlerts}
            icon={Boxes}
            accent="amber"
            hint="needs attention"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            label="Staff On Shift"
            value={`${s.employeesActive}/${s.employeesTotal}`}
            icon={Users}
            accent="primary"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Health Score" value={`${s.healthScore}%`} icon={HeartPulse} accent="emerald" />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueChart />
        <CategoryMix />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AIInsights />
        <ActivityFeed />
      </div>
    </div>
  )
}
