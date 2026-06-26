"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { revenueTrend } from "@/lib/mock-data"

export function RevenueChart({ data = [], total }: { data?: any[]; total?: number }) {
  const chartData = data.length > 0 ? data : revenueTrend
  
  // Format total revenue (in Lakhs or Thousands)
  const formatTotalRevenue = (val?: number) => {
    if (val === undefined) return "₹3.86L"
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`
    return `₹${(val / 1000).toFixed(1)}k`
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Last 7 days performance</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tracking-tight">{formatTotalRevenue(total)}</p>
            <p className="text-xs font-medium text-emerald-500">+12.4% vs last week</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={{ stroke: "hsl(var(--border))" }}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))",
                  fontSize: 12,
                }}
                formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#revFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
