"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Utensils,
  Search,
  Plus,
  Trash2,
  Edit,
  Tag,
  CheckCircle,
  AlertCircle,
  FileText,
  Flame,
  Info,
  Clock
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import * as menuService from "@/lib/services/menuService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function MenuMatrixPage() {
  const router = useRouter()
  const { token } = useAuth()

  // Data States
  const [categories, setCategories] = useState<menuService.MenuCategory[]>([])
  const [items, setItems] = useState<menuService.MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedItem, setSelectedItem] = useState<menuService.MenuItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Loading & Action States
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  
  // New Category Inputs
  const [newCatName, setNewCatName] = useState("")
  const [newCatDesc, setNewCatDesc] = useState("")
  const [newCatEmoji, setNewCatEmoji] = useState("🍽️")
  const [addingCategory, setAddingCategory] = useState(false)

  const loadMenuData = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setIsLoading(true)
    try {
      const [categoriesData, itemsData] = await Promise.all([
        menuService.getCategories(token),
        menuService.getMenuItems(token),
      ])
      setCategories(categoriesData)
      setItems(itemsData)
      
      // Auto select first item if none is selected
      if (itemsData.length > 0) {
        setSelectedItem(itemsData[0])
      } else {
        setSelectedItem(null)
      }
    } catch (err) {
      console.error("Failed to load menu matrix:", err)
      toast.error("Failed to load menu configurations.")
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadMenuData(true)
    }
  }, [token, loadMenuData])

  // listen to menuUpdated / ocrImport events
  useEffect(() => {
    const handleUpdate = () => loadMenuData(false)
    window.addEventListener("menuUpdated", handleUpdate)
    return () => {
      window.removeEventListener("menuUpdated", handleUpdate)
    }
  }, [loadMenuData])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = !selectedCategory || item.category_id === selectedCategory
      return matchesCategory
    })
  }, [items, selectedCategory])

  const handleSearch = async () => {
    if (!token) return
    setIsSearching(true)
    try {
      if (!searchQuery.trim()) {
        const itemsData = await menuService.getMenuItems(token)
        setItems(itemsData)
        if (itemsData.length > 0) setSelectedItem(itemsData[0])
        return
      }
      const itemsData = await menuService.searchMenuItems(searchQuery.trim(), selectedCategory || undefined, token)
      setItems(itemsData)
      if (itemsData.length > 0) {
        setSelectedItem(itemsData[0])
      } else {
        setSelectedItem(null)
      }
    } catch (err) {
      console.error("Menu search failed:", err)
      toast.error("Search failed.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleDeleteItem = async (item: menuService.MenuItem) => {
    if (!token) return
    const confirmed = window.confirm(`Delete "${item.name}"? This cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)
    const deleteToast = toast.loading(`Deleting ${item.name}...`)
    try {
      await menuService.deleteMenuItem(item.id, token)
      setItems((prev) => prev.filter((menuItem) => menuItem.id !== item.id))
      if (selectedItem?.id === item.id) {
        setSelectedItem(null)
      }
      toast.success("Dish deleted successfully!", { id: deleteToast })
    } catch (err) {
      console.error("Failed to delete menu item:", err)
      toast.error("Failed to delete item.", { id: deleteToast })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleAvailability = async (item: menuService.MenuItem) => {
    if (!token) return
    try {
      const updated = await menuService.toggleMenuItemAvailability(item.id, !item.is_available, token)
      setItems((prev) =>
        prev.map((menuItem) =>
          menuItem.id === item.id ? { ...menuItem, is_available: updated.is_available } : menuItem
        )
      )
      setSelectedItem((prev) => prev && prev.id === item.id ? { ...prev, is_available: updated.is_available } : prev)
      toast.success(`Marked "${item.name}" as ${updated.is_available ? 'Available' : 'Unavailable'}`)
    } catch (err) {
      console.error("Failed to toggle availability:", err)
      toast.error("Failed to change availability status.")
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newCatName) return
    setAddingCategory(true)
    try {
      await menuService.createMenuCategory(
        {
          name: newCatName.trim(),
          description: newCatDesc.trim() || undefined,
          icon_emoji: newCatEmoji,
          display_order: categories.length + 1
        },
        token
      )
      toast.success("Menu category added successfully!")
      setNewCatName("")
      setNewCatDesc("")
      setNewCatEmoji("🍽️")
      setShowAddCategory(false)
      loadMenuData(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || "Failed to create category.")
    } finally {
      setAddingCategory(false)
    }
  }

  const categoryCounts = useMemo(() => {
    return categories.reduce<Record<string, number>>((acc, category) => {
      acc[category.id] = items.filter((item) => item.category_id === category.id).length
      return acc
    }, {})
  }, [categories, items])

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Matrix" description="Manage categories, add/edit dishes, and configure pricing">
        <div className="flex items-center gap-3">
          <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full gap-1.5 text-xs font-semibold">
                <Tag className="h-3.5 w-3.5" /> + Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Menu Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Category Name *</label>
                  <Input
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Starters, Main Course"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                  <Input
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Brief category details"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Icon Emoji</label>
                  <Input
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value)}
                    placeholder="e.g. 🍕, 🍹, 🍰"
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddCategory(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addingCategory}>
                    {addingCategory ? "Creating..." : "Create Category"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button onClick={() => router.push("/menu/add")} className="rounded-full gap-1.5 text-xs font-semibold">
            <Plus className="h-4 w-4" /> Add Dish
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.8fr_1.4fr]">
        
        {/* Left Column: Categories */}
        <Card className="bg-[#0c101c]/40 border-border/60">
          <CardHeader className="py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</CardTitle>
              <Badge variant="secondary">{categories.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={cn(
                "w-full rounded-2xl px-4 py-3 text-left transition flex items-center justify-between text-sm",
                selectedCategory === ""
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-transparent text-muted-foreground hover:bg-muted/10 border border-transparent"
              )}
            >
              <span className="font-semibold flex items-center gap-1.5">
                <Utensils className="h-4 w-4" /> All Items
              </span>
              <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
            </button>
            
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "w-full rounded-2xl px-4 py-3.5 text-left transition flex items-center justify-between text-sm",
                  selectedCategory === category.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-transparent text-muted-foreground hover:bg-muted/10 border border-transparent"
                )}
              >
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="text-base">{category.icon_emoji || "🍽️"}</span>
                    {category.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[150px] truncate">
                    {category.description || "No description"}
                  </p>
                </div>
                <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full">
                  {categoryCounts[category.id] || 0}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Center Column: Menu Items */}
        <Card className="bg-[#0c101c]/40 border-border/60">
          <CardHeader className="py-4 border-b border-border/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dishes List</CardTitle>
              <div className="flex items-center gap-2 rounded-full border border-border bg-slate-950/70 px-3 py-1 text-sm max-w-xs flex-1">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch()
                  }}
                  placeholder="Search dishes..."
                  className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                />
                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleSearch}>
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted/40 border border-border/40" />
              ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "w-full rounded-2xl border p-3 text-left transition flex items-center justify-between gap-4",
                    selectedItem?.id === item.id
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 bg-background/50 hover:border-primary/20 hover:bg-muted/10"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-lg border border-border">
                      {item.is_bestseller ? "⭐" : "🍽️"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span className="text-primary font-bold">₹{item.price.toFixed(2)}</span>
                        <span>•</span>
                        <span>{item.preparation_time ? `${item.preparation_time} min` : "No prep time"}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.is_available ? "success" : "secondary"} className="rounded-full text-[10px] uppercase font-bold shrink-0">
                    {item.is_available ? "Available" : "Offline"}
                  </Badge>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No menu items found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Dish Details */}
        <Card className="bg-[#0c101c]/40 border-border/60">
          <CardHeader className="py-4 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dish Inspection</CardTitle>
            {selectedItem && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 text-primary"
                  onClick={() => router.push(`/menu/edit/${selectedItem.id}`)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                  onClick={() => handleDeleteItem(selectedItem)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-5">
            {selectedItem ? (
              <div className="space-y-5">
                {selectedItem.image_url ? (
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-slate-950 flex items-center justify-center">
                    <img src={selectedItem.image_url} alt={selectedItem.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-dashed border-border bg-muted/10 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Utensils className="h-8 w-8 text-muted-foreground/40" />
                    <span className="text-xs font-mono">No Image Uploaded</span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-extrabold text-foreground">{selectedItem.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed bg-muted/20 p-3 rounded-xl border border-border">
                    {selectedItem.description || "No description available."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-slate-950/40 p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price</span>
                    <p className="mt-1 text-lg font-bold text-emerald-400">₹{selectedItem.price.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-slate-950/40 p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prep Time</span>
                    <p className="mt-1 text-sm font-bold text-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4 text-primary" /> {selectedItem.preparation_time ? `${selectedItem.preparation_time} min` : "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold text-muted-foreground">Spice Level:</span>
                    <div className="flex gap-0.5 text-amber-500 font-bold">
                      {Array.from({ length: selectedItem.spice_level || 0 }).map((_, i) => (
                        <Flame key={i} className="h-3.5 w-3.5 fill-amber-500" />
                      ))}
                      {!(selectedItem.spice_level) && <span className="text-muted-foreground font-normal">None</span>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-muted-foreground">Bestseller Status:</span>
                    <p className="text-foreground font-semibold">{selectedItem.is_bestseller ? "⭐ Star Active" : "No"}</p>
                  </div>
                </div>

                <Button
                  onClick={() => handleToggleAvailability(selectedItem)}
                  className="w-full rounded-xl text-xs font-semibold gap-1.5"
                  variant="secondary"
                >
                  <CheckCircle className="h-4 w-4" /> Toggle Availability Status
                </Button>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground italic">
                Select a dish card to inspect properties.
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
