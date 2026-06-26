"use client"

import { IndianRupee, ShoppingBag, TrendingUp, Receipt } from "lucide-react"
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
import { monthlyRevenue, hourlyOrders, categoryMix, salesForecast, topSellingItems } from "@/lib/mock-data"

const inr = (v: number) => `₹${(v / 1000).toFixed(0)}k`
const inrLakh = (v: number) => `₹${(v / 100000).toFixed(1)}L`

export default function AnalyticsPage() {
  const maxSold = Math.max(...topSellingItems.map((t) => t.sold))

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Performance trends, forecasts, and best sellers">
        <Button variant="outline">Last 6 Months</Button>
        <Button>Export</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue (MTD)" value="₹71.8L" delta={15.6} icon={IndianRupee} accent="primary" index={0} />
        <StatCard label="Orders (MTD)" value="11,240" delta={8.3} icon={ShoppingBag} accent="sky" index={1} />
        <StatCard label="Avg Ticket" value="₹638" delta={4.1} icon={Receipt} accent="copper" index={2} />
        <StatCard label="Growth Rate" value="15.6%" delta={2.4} icon={TrendingUp} accent="emerald" index={3} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>6-month trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <RevenueAreaChart data={monthlyRevenue} dataKey="revenue" xKey="month" formatter={inrLakh} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Mix</CardTitle>
            <CardDescription>Sales share</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <CategoryPieChart data={categoryMix} />
            </div>
            <div className="mt-4 space-y-1.5">
              {categoryMix.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="font-medium">{c.value}%</span>
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
              <ForecastLineChart data={salesForecast} formatter={inr} />
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
            <CardDescription>Today&apos;s distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <OrdersBarChart data={hourlyOrders} dataKey="orders" xKey="hour" />
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
              <Badge variant="outline" className="h-7 w-7 justify-center rounded-full p-0">
                {i + 1}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">
                    {item.sold} sold · ₹{item.revenue.toLocaleString("en-IN")}
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
        </CardContent>
      </Card>
    </div>
  )
}
