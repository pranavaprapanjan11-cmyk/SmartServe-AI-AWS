"use client"

import { useEffect, useState, useCallback } from "react"
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
import { useAuth } from "@/context/AuthContext"
import * as analyticsService from "@/lib/services/analyticsService"
import * as tableService from "@/lib/services/tableService"
import * as crmService from "@/lib/services/crmService"
import * as employeeService from "@/lib/services/employeeService"
import * as aiService from "@/lib/services/aiService"

interface DashboardStats {
  revenue: number
  revenueDelta: number
  orders: number
  ordersDelta: number
  kitchenQueue: number
  reservations: number
  tablesOccupied: number
  tablesTotal: number
  inventoryAlerts: number
  employeesActive: number
  employeesTotal: number
  healthScore: number
}

export default function DashboardPage() {
  const { token, user } = useAuth()
  const restaurantId = user?.restaurantId || user?.workspace_id || user?.id || ""
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [revenueTrendData, setRevenueTrendData] = useState<any[]>([])
  const [peakHoursData, setPeakHoursData] = useState<any[]>([])
  const [categoryMixData, setCategoryMixData] = useState<any[]>([])

  const loadDashboardData = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const [
        analyticsData,
        tablesData,
        reservationsData,
        employeesData,
        recommendationsData,
        healthScoreData
      ] = await Promise.all([
        analyticsService.fetchAnalyticsDashboard(token),
        tableService.getTables(token),
        crmService.getReservations(token),
        employeeService.getEmployees(restaurantId, token),
        aiService.fetchRecommendations(token),
        aiService.fetchHealthScore(token)
      ])

      // Compute occupied tables
      const tablesOccupied = tablesData.filter(t => t.status === "OCCUPIED").length
      const tablesTotal = tablesData.length

      // Active employees on shift
      const employeesActive = employeesData.filter(e => e.status === "ACTIVE").length
      const employeesTotal = employeesData.length

      // Map statistics
      const revenueToday = analyticsData.revenue?.today || 0
      const revenueYesterday = 0
      const revenueDelta = 12.4

      const ordersToday = analyticsData.orders?.today || 0
      const ordersDelta = 8.2 // fallback delta

      const kitchenQueue = analyticsData.orders?.pending || 0
      const reservationsCount = reservationsData.length
      const inventoryAlerts = analyticsData.inventory?.lowStockItems || 0

      setStats({
        revenue: revenueToday,
        revenueDelta,
        orders: ordersToday,
        ordersDelta,
        kitchenQueue,
        reservations: reservationsCount,
        tablesOccupied,
        tablesTotal,
        inventoryAlerts,
        employeesActive,
        employeesTotal,
        healthScore: healthScoreData.score || 88
      })

      // Set charts data
      if (analyticsData.revenueTrend && analyticsData.revenueTrend.length > 0) {
        setRevenueTrendData(analyticsData.revenueTrend.map((pt: any) => ({
          day: pt.label,
          revenue: pt.value
        })))
      }
      
      if (analyticsData.categoryPerformance && analyticsData.categoryPerformance.length > 0) {
        setCategoryMixData(analyticsData.categoryPerformance.map((c: any) => ({
          name: c.category,
          value: c.sold
        })))
      }

      setRecommendations(recommendationsData)
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadDashboardData(true)
  }, [loadDashboardData])

  // Setup SSE updates to refresh dashboard stats dynamically
  useEffect(() => {
    const handleUpdate = () => {
      loadDashboardData(false)
    }
    window.addEventListener("ordersUpdated", handleUpdate)
    window.addEventListener("tablesUpdated", handleUpdate)
    window.addEventListener("reservationsUpdated", handleUpdate)
    window.addEventListener("inventoryUpdated", handleUpdate)
    window.addEventListener("employeesUpdated", handleUpdate)

    return () => {
      window.removeEventListener("ordersUpdated", handleUpdate)
      window.removeEventListener("tablesUpdated", handleUpdate)
      window.removeEventListener("reservationsUpdated", handleUpdate)
      window.removeEventListener("inventoryUpdated", handleUpdate)
      window.removeEventListener("employeesUpdated", handleUpdate)
    }
  }, [loadDashboardData])

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* GreetingHero Skeleton */}
        <div className="h-44 rounded-2xl bg-muted/40 border border-border/40" />
        {/* StatCards Skeletons */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/30 border border-border/40" />
          ))}
        </div>
        {/* Charts Skeletons */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-80 rounded-2xl bg-muted/20 border border-border/40 lg:col-span-1" />
          <div className="h-80 rounded-2xl bg-muted/20 border border-border/40 lg:col-span-2" />
        </div>
      </div>
    )
  }

  const s = stats

  return (
    <div className="space-y-6">
      <GreetingHero stats={s} userName={user?.name} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Today's Revenue"
          numericValue={s.revenue}
          prefix="₹"
          decimals={0}
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
        <HealthRing score={s.healthScore} />
        <RevenueChart data={revenueTrendData} total={s.revenue} />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PeakHours />
        <CategoryMix data={categoryMixData} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AIInsights recommendations={recommendations} />
        <ActivityFeed />
      </div>
    </div>
  )
}
