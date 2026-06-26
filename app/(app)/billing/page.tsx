"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Plus, Minus, Trash2, Receipt, CreditCard, Smartphone, Banknote, IndianRupee } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { menuItems } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface CartLine {
  id: string
  name: string
  price: number
  qty: number
}

const TAX_RATE = 0.05

export default function BillingPage() {
  const categories = useMemo(() => ["All", ...Array.from(new Set(menuItems.map((m) => m.category)))], [])
  const [activeCat, setActiveCat] = useState("All")
  const [cart, setCart] = useState<CartLine[]>([
    { id: "m1", name: "Butter Chicken", price: 480, qty: 2 },
    { id: "m4", name: "Garlic Naan", price: 80, qty: 4 },
  ])

  const visibleItems = menuItems.filter((m) => activeCat === "All" || m.category === activeCat)

  function add(item: { id: string; name: string; price: number }) {
    setCart((c) => {
      const existing = c.find((l) => l.id === item.id)
      if (existing) return c.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l))
      return [...c, { ...item, qty: 1 }]
    })
  }
  function changeQty(id: string, delta: number) {
    setCart((c) =>
      c.flatMap((l) => {
        if (l.id !== id) return [l]
        const qty = l.qty + delta
        return qty <= 0 ? [] : [{ ...l, qty }]
      }),
    )
  }

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0)
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax

  return (
    <div className="space-y-6">
      <PageHeader title="Billing / POS" description="Build the bill, apply taxes, and take payment" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Menu */}
        <div className="space-y-4 lg:col-span-3">
          <Tabs value={activeCat} onValueChange={setActiveCat}>
            <TabsList className="flex-wrap">
              {categories.map((c) => (
                <TabsTrigger key={c} value={c}>
                  {c}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleItems.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={!item.available}
                onClick={() => add(item)}
                className={cn(
                  "flex flex-col items-start rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm",
                  !item.available && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{item.category}</span>
                <span className="mt-2 flex items-center font-semibold text-primary">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {item.price}
                </span>
                {!item.available && (
                  <Badge variant="danger" className="mt-1">
                    Unavailable
                  </Badge>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Bill */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Current Bill
              </CardTitle>
              <Badge variant="outline">Table 12</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[280px] space-y-2 overflow-y-auto scrollbar-thin">
                {cart.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No items added yet.</p>
                )}
                {cart.map((line) => (
                  <div key={line.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{line.name}</p>
                      <p className="text-xs text-muted-foreground">₹{line.price} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeQty(line.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{line.qty}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => changeQty(line.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="w-16 text-right text-sm font-semibold">₹{line.price * line.qty}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setCart((c) => c.filter((l) => l.id !== line.id))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (5%)</span>
                  <span>₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pt-1 text-base font-semibold">
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment method</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "UPI", icon: Smartphone },
                    { label: "Card", icon: CreditCard },
                    { label: "Cash", icon: Banknote },
                  ].map((m) => (
                    <Button key={m.label} variant="outline" className="flex-col gap-1 h-auto py-2.5">
                      <m.icon className="h-4 w-4" />
                      <span className="text-xs">{m.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button className="w-full" size="lg" disabled={cart.length === 0}>
                Settle Bill · ₹{total.toLocaleString("en-IN")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
