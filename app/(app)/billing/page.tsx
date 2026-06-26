"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, Trash2, Receipt, CreditCard, Smartphone, Banknote, IndianRupee, Check } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedNumber } from "@/components/shared/animated-number"
import { menuItems } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface CartLine {
  id: string
  name: string
  price: number
  qty: number
}

const TAX_RATE = 0.05
const payMethods = [
  { label: "UPI", icon: Smartphone },
  { label: "Card", icon: CreditCard },
  { label: "Cash", icon: Banknote },
] as const

export default function BillingPage() {
  const categories = useMemo(() => ["All", ...Array.from(new Set(menuItems.map((m) => m.category)))], [])
  const [activeCat, setActiveCat] = useState("All")
  const [payMethod, setPayMethod] = useState<string>("UPI")
  const [settled, setSettled] = useState(false)
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

  function settle() {
    setSettled(true)
    setTimeout(() => {
      setSettled(false)
      setCart([])
    }, 2200)
  }

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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
                disabled={!item.available}
                onClick={() => add(item)}
                className={cn(
                  "group flex min-h-[112px] flex-col items-start justify-between rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-soft",
                  !item.available && "cursor-not-allowed opacity-50",
                )}
              >
                <div>
                  <span className="text-[15px] font-semibold text-foreground">{item.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.category}</span>
                </div>
                <div className="mt-3 flex w-full items-center justify-between">
                  <span className="flex items-center font-serif text-lg font-semibold text-primary">
                    <IndianRupee className="h-4 w-4" />
                    {item.price}
                  </span>
                  {item.available ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                      <Plus className="h-4 w-4" />
                    </span>
                  ) : (
                    <Badge variant="danger">86&apos;d</Badge>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Bill */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4 overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Current Bill
              </CardTitle>
              <Badge variant="outline">Table 12</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[280px] space-y-2 overflow-y-auto scrollbar-thin">
                <AnimatePresence initial={false} mode="popLayout">
                  {cart.length === 0 && !settled && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-2 py-10 text-center"
                    >
                      <Receipt className="h-7 w-7 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Tap a dish to start the bill</p>
                    </motion.div>
                  )}
                  {cart.map((line) => (
                    <motion.div
                      key={line.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96, height: 0 }}
                      animate={{ opacity: 1, scale: 1, height: "auto" }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      className="flex items-center gap-2 rounded-xl border border-border p-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{line.name}</p>
                        <p className="text-xs text-muted-foreground">₹{line.price} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => changeQty(line.id, -1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <motion.span
                          key={line.qty}
                          initial={{ scale: 1.4 }}
                          animate={{ scale: 1 }}
                          className="w-7 text-center text-sm font-semibold"
                        >
                          {line.qty}
                        </motion.span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => changeQty(line.id, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <span className="w-16 text-right text-sm font-semibold">₹{line.price * line.qty}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setCart((c) => c.filter((l) => l.id !== line.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="space-y-1.5 border-t border-dashed border-border pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (5%)</span>
                  <span>₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-baseline justify-between pt-1 text-base font-semibold">
                  <span>Total</span>
                  <AnimatedNumber value={total} prefix="₹" duration={500} className="font-serif text-xl" />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment method</p>
                <div className="grid grid-cols-3 gap-2">
                  {payMethods.map((m) => {
                    const active = payMethod === m.label
                    return (
                      <motion.button
                        key={m.label}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPayMethod(m.label)}
                        className={cn(
                          "flex h-auto flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-all",
                          active
                            ? "border-primary bg-primary/10 text-primary shadow-soft"
                            : "border-border text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        <m.icon className="h-5 w-5" />
                        {m.label}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <Button className="h-12 w-full text-base" size="lg" disabled={cart.length === 0} onClick={settle}>
                Settle Bill · ₹{total.toLocaleString("en-IN")}
              </Button>
            </CardContent>

            {/* Settle success overlay */}
            <AnimatePresence>
              {settled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card/95 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success"
                  >
                    <Check className="h-10 w-10" strokeWidth={3} />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-serif text-lg font-semibold"
                  >
                    Payment received
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-muted-foreground"
                  >
                    Paid via {payMethod} · receipt sent
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  )
}
