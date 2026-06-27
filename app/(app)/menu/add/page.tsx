"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Plus, Save, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"
import * as menuService from "@/lib/services/menuService"
import { toast } from "sonner"

export default function AddMenuItemPage() {
  const router = useRouter()
  const { token } = useAuth()

  // Form State
  const [categoryId, setCategoryId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [preparationTime, setPreparationTime] = useState("")
  const [spiceLevel, setSpiceLevel] = useState("0")
  const [dietaryInfo, setDietaryInfo] = useState("")
  const [calories, setCalories] = useState("")
  const [isAvailable, setIsAvailable] = useState(true)
  const [isBestseller, setIsBestseller] = useState(false)

  // Options & Loading
  const [categories, setCategories] = useState<menuService.MenuCategory[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) return
      try {
        const data = await menuService.getCategories(token)
        setCategories(data)
      } catch (err) {
        console.error("Failed to fetch categories:", err)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [token])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!categoryId) newErrors.categoryId = "Category is required"
    if (!name.trim()) newErrors.name = "Item name is required"
    if (!price || parseFloat(price) <= 0) newErrors.price = "Valid price (> 0) is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.")
      return
    }

    setSubmitting(true)
    const addToast = toast.loading("Adding menu item...")
    try {
      const payload: menuService.CreateMenuItemPayload = {
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        image_url: imageUrl.trim() || undefined,
        preparation_time: preparationTime ? parseInt(preparationTime) : undefined,
        spice_level: parseInt(spiceLevel),
        dietary_info: dietaryInfo || undefined,
        calories: calories ? parseInt(calories) : undefined,
        is_available: isAvailable,
        is_bestseller: isBestseller,
      }

      await menuService.createMenuItem(payload, token)
      toast.success(`"${name}" created successfully!`, { id: addToast })
      
      // Dispatch live update
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("menuUpdated"))
      }
      
      router.push("/menu")
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.response?.data?.message || "Failed to create menu item"
      toast.error(errorMsg, { id: addToast })
      setErrors({ submit: errorMsg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/menu")} className="rounded-full">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Back to Menu</span>
      </div>

      <PageHeader title="Add Dish" description="Configure a new menu dish card with details, pricing, and category mapping" />

      <div className="max-w-2xl mx-auto">
        <Card className="bg-[#0c101c]/40 border-border/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" /> New Dish Specifications
            </CardTitle>
            <CardDescription>All fields marked with an asterisk (*) are required.</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.submit && (
              <div className="mb-6 p-4 bg-rose-600/10 border border-rose-600/20 rounded-xl text-rose-400 text-xs font-mono">
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={loadingCategories}
                    className="w-full h-10 px-3 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  >
                    <option value="">Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon_emoji || "🍽️"} {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-rose-400 text-[10px]">{errors.categoryId}</p>}
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Dish Name *</label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Garlic Naan, Butter Chicken"
                  />
                  {errors.name && <p className="text-rose-400 text-[10px]">{errors.name}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ingredients details, spice level highlights, portion sizes..."
                  className="w-full min-h-[90px] p-3 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Price */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Price (₹) *</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 290"
                  />
                  {errors.price && <p className="text-rose-400 text-[10px]">{errors.price}</p>}
                </div>

                {/* Prep Time */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Prep Time (mins)</label>
                  <Input
                    type="number"
                    min="1"
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(e.target.value)}
                    placeholder="e.g. 15"
                  />
                </div>

                {/* Spice Level */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Spice Level</label>
                  <select
                    value={spiceLevel}
                    onChange={(e) => setSpiceLevel(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  >
                    <option value="0">0 - Non Spicy</option>
                    <option value="1">1 - Mild</option>
                    <option value="2">2 - Medium</option>
                    <option value="3">3 - Hot</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Dietary Info */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Dietary Info</label>
                  <Input
                    value={dietaryInfo}
                    onChange={(e) => setDietaryInfo(e.target.value)}
                    placeholder="e.g. Veg, Vegan, Gluten-Free"
                  />
                </div>

                {/* Calories */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Calories (kcal)</label>
                  <Input
                    type="number"
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="e.g. 350"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Image URL</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-3">
                <label className="flex items-center gap-2 text-sm text-foreground font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  Is Available
                </label>

                <label className="flex items-center gap-2 text-sm text-foreground font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestseller}
                    onChange={(e) => setIsBestseller(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  Mark as Bestseller ⭐
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => router.push("/menu")} className="rounded-full px-6">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-full px-8 gap-1.5 font-bold">
                  <Save className="h-4 w-4" /> Save Dish
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
