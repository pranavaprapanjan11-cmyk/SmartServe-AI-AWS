"use client"

import { useEffect, useState, useMemo } from "react"
import { IndianRupee, ShoppingBag, TrendingUp, Receipt, AlertTriangle, ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RevenueAreaChart,
  OrdersBarChart,
  CategoryPieChart,
  ForecastLineChart,
} from "@/components/charts/charts"
import { useAuth } from "@/context/AuthContext"
import * as analyticsService from "@/lib/services/analyticsService"
import { toast } from "sonner"

export default function AnalyticsPage() {
  const { token, sseActive } = useAuth()
  const [dashboard, setDashboard] = useState<analyticsService.AnalyticsDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAnalytics = async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const data = await analyticsService.fetchAnalyticsDashboard(token)
      setDashboard(data)
    } catch (err: any) {
      console.error("Failed to load analytics:", err)
      toast.error("Failed to fetch analytics metrics.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics(true)
  }, [])

  useEffect(() => {
    const handleUpdate = () => loadAnalytics(false)
    window.addEventListener("ordersUpdated", handleUpdate)
    return () => {
      window.removeEventListener("ordersUpdated", handleUpdate)
    }
  }, [])

  // Formatters
  const inr = (v: number) => `₹${(v / 1000).toFixed(0)}k`
  const inrLakh = (v: number) => `₹${(v / 100000).toFixed(1)}L`

  // Chart data mappings
  const monthlyRevenue = useMemo(() => {
    if (!dashboard?.revenueTrend) return []
    return dashboard.revenueTrend.map((pt) => ({
      month: pt.label,
      revenue: pt.value
    }))
  }, [dashboard])

  const categoryMix = useMemo(() => {
    if (!dashboard?.categoryPerformance) return []
    // Calculate total sold to compute percentages
    const totalSold = dashboard.categoryPerformance.reduce((sum, c) => sum + (c.sold || 0), 0) || 1
    return dashboard.categoryPerformance.map((c) => ({
      name: c.category,
      value: Math.round(((c.sold || 0) / totalSold) * 100)
    }))
  }, [dashboard])

  const hourlyOrders = useMemo(() => {
    if (!dashboard?.ordersTrend) return []
    return dashboard.ordersTrend.map((ot) => ({
      hour: ot.label,
      orders: ot.count
    }))
  }, [dashboard])

  const salesForecast = useMemo(() => {
    if (!dashboard?.revenueTrend) return []
    return dashboard.revenueTrend.map((pt) => ({
      month: pt.label,
      actual: pt.value,
      forecast: Math.round(pt.value * 1.12) // Simulated AI 12% growth prediction
    }))
  }, [dashboard])

  const topSellingItems = useMemo(() => {
    return dashboard?.topSellingItems || []
  }, [dashboard])

  const maxSold = useMemo(() => {
    if (topSellingItems.length === 0) return 1
    return Math.max(...topSellingItems.map((t) => t.sold))
  }, [topSellingItems])

  if (loading && !dashboard) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  const revenueMtd = dashboard?.revenue.month || 0
  const ordersMtd = dashboard?.orders.total || 0
  const avgTicket = dashboard?.orders.averageOrderValue || 0
  const healthScore = dashboard?.healthScore.score || 0

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Restaurant performance trends, forecasts, and best sellers">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-primary/20 bg-primary/5 text-primary">
            Health: {healthScore}% ({dashboard?.healthScore.label || "Good"})
          </Badge>
          <Button variant="outline" onClick={() => loadAnalytics(true)}>Refresh</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue (MTD)" value={`₹${(revenueMtd / 100000).toFixed(1)}L`} icon={IndianRupee} accent="primary" index={0} />
        <StatCard label="Orders (MTD)" value={ordersMtd} icon={ShoppingBag} accent="sky" index={1} />
        <StatCard label="Avg Ticket" value={`₹${avgTicket.toFixed(0)}`} icon={Receipt} accent="copper" index={2} />
        <StatCard label="Health Score" value={`${healthScore}%`} icon={TrendingUp} accent="emerald" index={3} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue trajectory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {monthlyRevenue.length > 0 ? (
                <RevenueAreaChart data={monthlyRevenue} dataKey="revenue" xKey="month" formatter={inrLakh} />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No revenue data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Mix</CardTitle>
            <CardDescription>Sales distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              {categoryMix.length > 0 ? (
                <CategoryPieChart data={categoryMix} />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No category distribution</div>
              )}
            </div>
            <div className="mt-4 space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
              {categoryMix.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">{c.name}</span>
                  <span className="font-semibold text-xs">{c.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Forecast</CardTitle>
            <CardDescription>Actual vs AI-predicted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              {salesForecast.length > 0 ? (
                <ForecastLineChart data={salesForecast} formatter={inr} />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No forecast available</div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-primary" /> Actual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-copper" /> Forecast
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Hour</CardTitle>
            <CardDescription>Active hour peaks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              {hourlyOrders.length > 0 ? (
                <OrdersBarChart data={hourlyOrders} dataKey="orders" xKey="hour" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No hourly trends</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
          <CardDescription>By units sold this month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {topSellingItems.map((item, i) => (
            <div key={item.name} className="flex items-center gap-4">
              <Badge variant="outline" className="h-7 w-7 justify-center rounded-full p-0 shrink-0">
                {i + 1}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium truncate">{item.name}</span>
                  <span className="text-muted-foreground text-xs shrink-0">
                    {item.sold} sold · ₹{Number(item.revenue).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((item.sold / maxSold) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {topSellingItems.length === 0 && (
            <p className="text-center py-6 text-muted-foreground text-sm">No top items loaded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
