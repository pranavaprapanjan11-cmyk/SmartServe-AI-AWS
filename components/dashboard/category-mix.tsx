"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { categoryMix } from "@/lib/mock-data"

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

export function CategoryMix({ data = [] }: { data?: any[] }) {
  const rawData = data.length > 0 ? data : categoryMix
  const totalValue = rawData.reduce((sum, item) => sum + item.value, 0)
  
  const chartData = rawData.map(item => ({
    name: item.name,
    value: totalValue > 0 ? parseFloat(((item.value / totalValue) * 100).toFixed(1)) : item.value
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Mix</CardTitle>
        <CardDescription>Sales by menu category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                stroke="none"
              >
                {chartData.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))",
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {chartData.map((c, i) => (
            <div key={c.name} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-muted-foreground">{c.name}</span>
              <span className="ml-auto font-medium">{c.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
