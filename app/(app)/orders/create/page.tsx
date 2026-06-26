"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { ChevronLeft, Plus, Minus, Search, ShoppingBag, Utensils, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import * as menuService from "@/lib/services/menuService"
import * as orderService from "@/lib/services/orderService"

interface SelectedItem {
  item: menuService.MenuItem
  quantity: number
}

function CreateOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuth()

  // Inputs
  const [tableNumber, setTableNumber] = useState<number>(1)
  const [guestCount, setGuestCount] = useState<number>(1)
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  // Data from backend
  const [menuItems, setMenuItems] = useState<menuService.MenuItem[]>([])
  const [categories, setCategories] = useState<menuService.MenuCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  
  // Cart
  const [cart, setCart] = useState<SelectedItem[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Load table number from query param if available
  useEffect(() => {
    const tableParam = searchParams.get("table")
    if (tableParam) {
      const parsed = parseInt(tableParam)
      if (!isNaN(parsed)) {
        setTableNumber(parsed)
      }
    }
  }, [searchParams])

  // Fetch menu data
  useEffect(() => {
    const loadMenuData = async () => {
      if (!token) return
      try {
        setLoading(true)
        const [itemsData, categoriesData] = await Promise.all([
          menuService.getMenuItems(token),
          menuService.getCategories(token),
        ])
        
        // Filter out unavailable items
        setMenuItems(itemsData.filter(i => i.is_available))
        setCategories(categoriesData.filter(c => c.is_active))
      } catch (err: any) {
        console.error("Failed to load menu details:", err)
        toast.error("Failed to load menu items. Please verify configuration.")
      } finally {
        setLoading(false)
      }
    }

    loadMenuData()
  }, [token])

  // Cart actions
  const addToCart = (item: menuService.MenuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((c) => c.item.id === item.id)
      if (existing) {
        return prevCart.map((c) => 
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prevCart, { item, quantity: 1 }]
    })
    toast.success(`${item.name} added to cart`, { duration: 1000 })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta
            return { ...c, quantity: newQty }
          }
          return c
        })
        .filter((c) => c.quantity > 0)
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((c) => c.item.id !== itemId))
  }

  // Calculations
  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0)
  const tax = subtotal * 0.18 // 18% GST
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (cart.length === 0) {
      toast.error("Please add at least one item to the order")
      return
    }

    try {
      setSubmitting(true)
      
      const payload: orderService.CreateOrderPayload = {
        table_number: tableNumber,
        guest_count: guestCount,
        items: cart.map((c) => ({
          menu_item_id: c.item.id,
          quantity: c.quantity,
        })),
      }

      const createdOrder = await orderService.createOrder(payload, token)
      
      // Dispatch custom activity event (triggers live updates)
      const event = new CustomEvent("liveActivityEvent", {
        detail: { type: "orderCreated", data: { orderId: createdOrder.id } }
      })
      window.dispatchEvent(event)
      
      toast.success("Order sent to kitchen!")
      router.push(`/orders/${createdOrder.id}`)
    } catch (err: any) {
      console.error("Failed to submit order:", err)
      toast.error(err?.response?.data?.message || "Failed to place order. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Filter items based on category and search query
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategory
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags && item.tags.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.push("/orders")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Create Order</h1>
          <p className="text-sm text-muted-foreground">Select table and items to send to the kitchen</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Menu Selection (Left) */}
          <div className="space-y-6">
            {/* Order Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Table Number</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guest Count</label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-bold w-8 text-center">{guestCount}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setGuestCount(guestCount + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Browse Menu */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Browse Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, tags, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 pb-1">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>

                {/* Items List */}
                <div className="grid gap-3 sm:grid-cols-2 max-h-[400px] overflow-y-auto pr-1">
                  <AnimatePresence mode="popLayout">
                    {filteredItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/40 transition"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-semibold text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">₹{item.price}</p>
                          {item.description && (
                            <p className="text-[10px] text-muted-foreground truncate mt-1">{item.description}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addToCart(item)}
                          className="h-8 shrink-0 gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </Button>
                      </motion.div>
                    ))}
                    {filteredItems.length === 0 && (
                      <div className="col-span-full py-12 text-center text-muted-foreground text-sm">
                        <Utensils className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                        No available menu items found.
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart Panel (Right) */}
          <div className="h-fit">
            <Card className="sticky top-6">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" /> Cart Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  <AnimatePresence mode="popLayout">
                    {cart.map((cartItem) => (
                      <motion.div
                        key={cartItem.item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center justify-between py-1 border-b border-border/40 pb-2 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-sm font-medium truncate">{cartItem.item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">₹{cartItem.item.price} each</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Qty controls */}
                          <div className="flex items-center rounded-lg border border-border bg-muted/30 px-2 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(cartItem.item.id, -1)}
                              className="text-muted-foreground hover:text-foreground px-1 text-sm font-semibold"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{cartItem.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(cartItem.item.id, 1)}
                              className="text-muted-foreground hover:text-foreground px-1 text-sm font-semibold"
                            >
                              +
                            </button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => removeFromCart(cartItem.item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    {cart.length === 0 && (
                      <div className="py-12 text-center text-muted-foreground text-sm">
                        Cart is empty. Select menu items.
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Calculations */}
                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST (18%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                    <span>Total</span>
                    <span className="text-primary">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || cart.length === 0}
                  className="w-full h-11 text-sm font-medium"
                >
                  {submitting ? "Sending to Kitchen..." : "Send to Kitchen"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default function WrappedCreateOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <CreateOrderPage />
    </Suspense>
  )
}
