"use client"

import { motion } from "framer-motion"
import { Boxes, AlertTriangle, Package, TrendingDown, Plus, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { inventoryItems, inventoryCategories, type InventoryItem } from "@/lib/mock-data"

const statusVariant: Record<InventoryItem["status"], "success" | "warning" | "danger"> = {
  ok: "success",
  low: "warning",
  critical: "danger",
}

export default function InventoryPage() {
  const critical = inventoryItems.filter((i) => i.status === "critical").length
  const low = inventoryItems.filter((i) => i.status === "low").length
  const totalValue = inventoryCategories.reduce((s, c) => s + c.value, 0)
  const totalItems = inventoryCategories.reduce((s, c) => s + c.items, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Stock levels, suppliers, and reorder alerts">
        <Button variant="outline">Stock Count</Button>
        <Button>
          <Plus className="h-4 w-4" /> Purchase Order
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total SKUs" value={totalItems} icon={Package} accent="primary" index={0} />
        <StatCard
          label="Stock Value"
          value={`₹${(totalValue / 1000).toFixed(0)}k`}
          icon={Boxes}
          accent="copper"
          index={1}
        />
        <StatCard label="Low Stock" value={low} icon={TrendingDown} accent="amber" index={2} />
        <StatCard label="Critical" value={critical} icon={AlertTriangle} accent="orange" index={3} />
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">AI Reorder Suggestion</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Paneer and Chicken will run out within today&apos;s service. Auto-draft purchase orders to Amul Dairy
              (10 kg) and Fresh Meats Co (15 kg)?
            </p>
          </div>
          <Button size="sm" variant="outline">
            Draft POs
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stock Items</CardTitle>
            <CardDescription>Live quantities against par levels</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="w-32">Level</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.map((item, i) => {
                  const pct = Math.min(100, Math.round((item.stock / item.par) * 100))
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.category}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.stock} {item.unit}
                        <span className="text-xs text-muted-foreground"> / {item.par}</span>
                      </TableCell>
                      <TableCell>
                        <Progress value={pct} className="h-1.5" />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.supplier}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[item.status]} className="capitalize">
                          {item.status}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <CardDescription>Value distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inventoryCategories.map((c) => {
              const pct = Math.round((c.value / totalValue) * 100)
              return (
                <div key={c.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">₹{(c.value / 1000).toFixed(0)}k</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">{c.items} items</p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
