"use client"

import { useEffect, useState, useMemo, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Boxes, AlertTriangle, Package, TrendingDown, Plus, Sparkles, Search, Trash2, Save, Utensils } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import * as inventoryService from "@/lib/services/inventoryService"
import * as menuService from "@/lib/services/menuService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import SuppliersTab from "@/components/inventory/suppliers-tab"
import PurchaseOrdersTab from "@/components/inventory/purchase-orders-tab"
import WastageTab from "@/components/inventory/wastage-tab"
import ReconciliationTab from "@/components/inventory/reconciliation-tab"

function InventoryPage() {
  const { token } = useAuth()

  // Tab State
  const [activeTab, setActiveTab] = useState<"stock" | "recipes" | "suppliers" | "purchase-orders" | "wastage" | "reconciliation">("stock")
  
  // Data States
  const [inventoryItems, setInventoryItems] = useState<inventoryService.InventoryItem[]>([])
  const [menuItems, setMenuItems] = useState<menuService.MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  // Form States
  const [showAddSku, setShowAddSku] = useState(false)
  const [skuName, setSkuName] = useState("")
  const [skuDesc, setSkuDesc] = useState("")
  const [skuUnit, setSkuUnit] = useState("kg")
  const [skuStock, setSkuStock] = useState(10)
  const [skuPar, setSkuPar] = useState(5)
  const [submitting, setSubmitting] = useState(false)

  // Recipe Mapper States
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("")
  const [recipeLines, setRecipeLines] = useState<inventoryService.MenuItemRecipe[]>([])
  const [addIngredientId, setAddIngredientId] = useState<string>("")
  const [addQtyRequired, setAddQtyRequired] = useState<number>(0)
  const [recipeSaving, setRecipeSaving] = useState(false)

  const loadInventoryData = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const [invData, menuData] = await Promise.all([
        inventoryService.getInventoryItems(token),
        menuService.getMenuItems(token)
      ])
      setInventoryItems(invData)
      setMenuItems(menuData)
      if (menuData.length > 0 && !selectedMenuItemId) {
        setSelectedMenuItemId(menuData[0].id)
      }
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load inventory resources.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token, selectedMenuItemId])

  useEffect(() => {
    loadInventoryData(true)
  }, [])

  // Listen to SSE / updates
  useEffect(() => {
    const handleUpdate = () => loadInventoryData(false)
    window.addEventListener("inventoryUpdated", handleUpdate)
    return () => {
      window.removeEventListener("inventoryUpdated", handleUpdate)
    }
  }, [loadInventoryData])

  // Load recipe when selected menu item changes
  useEffect(() => {
    const loadRecipe = async () => {
      if (!token || !selectedMenuItemId) return
      try {
        const recipe = await inventoryService.getRecipeForMenuItem(selectedMenuItemId, token)
        setRecipeLines(recipe)
      } catch (err) {
        console.error("Failed to load recipe mapping:", err)
      }
    }
    loadRecipe()
  }, [selectedMenuItemId, token])

  const handleCreateSku = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !skuName) return
    try {
      setSubmitting(true)
      await inventoryService.createInventoryItem(
        {
          name: skuName,
          description: skuDesc || undefined,
          unit: skuUnit,
          quantity_on_hand: skuStock,
          reorder_threshold: skuPar,
          is_active: true
        },
        token
      )
      toast.success("Inventory item added successfully!")
      setSkuName("")
      setSkuDesc("")
      setSkuUnit("kg")
      setSkuStock(10)
      setSkuPar(5)
      setShowAddSku(false)
      loadInventoryData(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || "Failed to create inventory item.")
    } finally {
      setSubmitting(false)
    }
  }

  // Recipe handlers
  const handleAddIngredient = () => {
    if (!addIngredientId || addQtyRequired <= 0) {
      toast.error("Select ingredient and enter valid quantity")
      return
    }

    const ing = inventoryItems.find(i => i.id === addIngredientId)
    if (!ing) return

    setRecipeLines((prev) => {
      const existing = prev.find(line => line.inventory_item_id === addIngredientId)
      if (existing) {
        return prev.map(line =>
          line.inventory_item_id === addIngredientId
            ? { ...line, quantity_required: addQtyRequired }
            : line
        )
      }
      return [
        ...prev,
        {
          id: `${addIngredientId}-${Date.now()}`,
          menu_item_id: selectedMenuItemId,
          inventory_item_id: addIngredientId,
          inventory_item_name: ing.name,
          inventory_item_unit: ing.unit,
          quantity_required: addQtyRequired
        }
      ]
    })
    setAddIngredientId("")
    setAddQtyRequired(0)
  }

  const handleRemoveIngredient = (ingId: string) => {
    setRecipeLines((prev) => prev.filter(line => line.inventory_item_id !== ingId))
  }

  const handleSaveRecipe = async () => {
    if (!token || !selectedMenuItemId) return
    try {
      setRecipeSaving(true)
      await inventoryService.saveRecipeForMenuItem(
        selectedMenuItemId,
        recipeLines.map(line => ({
          inventory_item_id: line.inventory_item_id,
          quantity_required: line.quantity_required
        })),
        token
      )
      toast.success("Recipe ingredients saved successfully!")
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to save recipe configuration.")
    } finally {
      setRecipeSaving(false)
    }
  }

  // Filter Stock SKUs
  const filteredSkus = useMemo(() => {
    return inventoryItems.filter(
      (item) => item.name.toLowerCase().includes(query.toLowerCase())
    )
  }, [inventoryItems, query])

  // Stats Calculations
  const criticalCount = useMemo(() => {
    return inventoryItems.filter(i => i.quantity_on_hand <= i.reorder_threshold * 0.5).length
  }, [inventoryItems])

  const lowCount = useMemo(() => {
    return inventoryItems.filter(i => i.quantity_on_hand <= i.reorder_threshold && i.quantity_on_hand > i.reorder_threshold * 0.5).length
  }, [inventoryItems])

  const getSkuStatusVariant = (item: inventoryService.InventoryItem): "success" | "warning" | "danger" => {
    if (item.quantity_on_hand <= item.reorder_threshold * 0.5) return "danger"
    if (item.quantity_on_hand <= item.reorder_threshold) return "warning"
    return "success"
  }

  const getSkuStatusLabel = (item: inventoryService.InventoryItem): string => {
    if (item.quantity_on_hand <= item.reorder_threshold * 0.5) return "Critical"
    if (item.quantity_on_hand <= item.reorder_threshold) return "Low"
    return "OK"
  }

  if (loading && menuItems.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Stock levels, raw materials and recipes mapper">
        {activeTab === "stock" && (
          <Dialog open={showAddSku} onOpenChange={setShowAddSku}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1.5" /> Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Raw Material</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSku} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item Name</label>
                  <Input required value={skuName} onChange={(e) => setSkuName(e.target.value)} placeholder="e.g. Fresh Paneer" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                  <Input value={skuDesc} onChange={(e) => setSkuDesc(e.target.value)} placeholder="e.g. Milk paneer cubes" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit</label>
                    <Input required value={skuUnit} onChange={(e) => setSkuUnit(e.target.value)} placeholder="e.g. kg, L, pcs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</label>
                    <Input type="number" required value={skuStock} onChange={(e) => setSkuStock(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Par Level</label>
                    <Input type="number" required value={skuPar} onChange={(e) => setSkuPar(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddSku(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>Onboard SKU</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {(activeTab === "stock" || activeTab === "recipes") && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total SKUs" value={inventoryItems.length} icon={Package} accent="primary" index={0} />
          <StatCard label="In Stock Items" value={inventoryItems.filter(i => i.quantity_on_hand > i.reorder_threshold).length} icon={Boxes} accent="emerald" index={1} />
          <StatCard label="Low Stock" value={lowCount} icon={TrendingDown} accent="amber" index={2} />
          <StatCard label="Critical Alarms" value={criticalCount} icon={AlertTriangle} accent="orange" index={3} />
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as any)
            setQuery("")
          }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-4">
              <TabsList className="flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="stock">Stock List</TabsTrigger>
                <TabsTrigger value="recipes">Recipe Mapper</TabsTrigger>
                <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
                <TabsTrigger value="wastage">Wastage Log</TabsTrigger>
                <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
              </TabsList>

              {activeTab === "stock" && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search stock..."
                    className="pl-9"
                  />
                </div>
              )}
            </div>

            {/* TAB CONTENT: STOCK LIST */}
            {activeTab === "stock" && (
              <TabsContent value="stock" className="m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead className="w-36">Progress Bar</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSkus.map((item) => {
                    const progress = item.reorder_threshold > 0 
                      ? Math.min(100, Math.round((item.quantity_on_hand / item.reorder_threshold) * 100))
                      : 100
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{item.description || "No description"}</TableCell>
                        <TableCell className="font-medium text-xs">
                          {item.quantity_on_hand} {item.unit}
                          <span className="text-muted-foreground"> / par {item.reorder_threshold} {item.unit}</span>
                        </TableCell>
                        <TableCell>
                          <Progress value={progress} className="h-1.5" />
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSkuStatusVariant(item)}>
                            {getSkuStatusLabel(item)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredSkus.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No materials found in current repository.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </TabsContent>
            )}

            {/* TAB CONTENT: RECIPE MAPPER */}
            {activeTab === "recipes" && (
              <TabsContent value="recipes" className="m-0">
              <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
                {/* Menu Item Selector (Left) */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Menu Item</label>
                    <select
                      value={selectedMenuItemId}
                      onChange={(e) => setSelectedMenuItemId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-input bg-card text-foreground focus:ring-primary text-sm font-medium"
                    >
                      {menuItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} (₹{item.price})</option>
                      ))}
                    </select>
                  </div>

                  {/* Add Ingredient Form */}
                  <Card className="bg-muted/15 border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Add Ingredient</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ingredient</label>
                        <select
                          value={addIngredientId}
                          onChange={(e) => setAddIngredientId(e.target.value)}
                          className="w-full h-9 px-2 rounded-lg border border-input bg-card text-foreground focus:ring-primary text-xs"
                        >
                          <option value="">Select ingredient SKU...</option>
                          {inventoryItems.map(i => (
                            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Quantity Required</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={addQtyRequired || ""}
                            onChange={(e) => setAddQtyRequired(parseFloat(e.target.value) || 0)}
                            className="h-9 text-xs"
                            placeholder="e.g. 0.25"
                          />
                          <Button type="button" size="sm" onClick={handleAddIngredient} className="shrink-0 h-9">
                            Add +
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recipe Mapping View (Right) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">Ingredient Breakdown</h4>
                      <p className="text-xs text-muted-foreground">Adjust quantities and save mappings</p>
                    </div>
                    <Button onClick={handleSaveRecipe} disabled={recipeSaving || !selectedMenuItemId} size="sm" className="gap-1.5">
                      <Save className="h-4 w-4" /> {recipeSaving ? "Saving..." : "Save Recipe"}
                    </Button>
                  </div>

                  <div className="border border-border rounded-xl bg-card overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Qty Required</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipeLines.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell className="font-medium text-sm">{line.inventory_item_name}</TableCell>
                            <TableCell className="text-xs">
                              {line.quantity_required} {line.inventory_item_unit}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveIngredient(line.inventory_item_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {recipeLines.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-12 text-muted-foreground text-xs italic">
                              <Utensils className="mx-auto h-6 w-6 text-muted-foreground/30 mb-2" />
                              No ingredients mapped to this recipe. Select ingredients on the left.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              </TabsContent>
            )}

            {activeTab === "suppliers" && (
              <TabsContent value="suppliers" className="m-0 pt-2">
                <SuppliersTab />
              </TabsContent>
            )}
            {activeTab === "purchase-orders" && (
              <TabsContent value="purchase-orders" className="m-0 pt-2">
                <PurchaseOrdersTab />
              </TabsContent>
            )}
            {activeTab === "wastage" && (
              <TabsContent value="wastage" className="m-0 pt-2">
                <WastageTab />
              </TabsContent>
            )}
            {activeTab === "reconciliation" && (
              <TabsContent value="reconciliation" className="m-0 pt-2">
                <ReconciliationTab />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default memo(InventoryPage)
