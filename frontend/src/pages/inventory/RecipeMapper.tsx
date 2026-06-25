import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import * as inventoryService from '../../services/inventoryService'
import * as menuService from '../../services/menuService'
import { MenuItem } from '../../services/menuService'
import { InventoryItem, MenuItemRecipe, MenuItemRecipeLine } from '../../services/inventoryService'

const RecipeMapper: React.FC = () => {
  const { token } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('')
  const [recipe, setRecipe] = useState<MenuItemRecipe[]>([])
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('')
  const [quantityRequired, setQuantityRequired] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadResources = async () => {
      if (!token) return
      setIsLoading(true)
      setError(null)
      try {
        const [menuData, inventoryData] = await Promise.all([
          menuService.getMenuItems(token),
          inventoryService.getInventoryItems(token),
        ])
        setMenuItems(menuData)
        setInventoryItems(inventoryData)
        if (menuData.length > 0) {
          setSelectedMenuItemId(menuData[0].id)
        }
      } catch (err) {
        console.error('Failed to load recipe mapper resources', err)
        setError('Unable to load menu or inventory data.')
      } finally {
        setIsLoading(false)
      }
    }

    loadResources()
  }, [token])

  useEffect(() => {
    const loadRecipe = async () => {
      if (!token || !selectedMenuItemId) return
      setError(null)
      try {
        const recipeData = await inventoryService.getRecipeForMenuItem(selectedMenuItemId, token)
        setRecipe(recipeData)
      } catch (err) {
        console.error('Failed to load recipe', err)
        setError('Unable to load recipe for selected menu item.')
      }
    }

    loadRecipe()
  }, [selectedMenuItemId, token])

  const selectedMenuItem = useMemo(
    () => menuItems.find((item) => item.id === selectedMenuItemId),
    [menuItems, selectedMenuItemId]
  )

  const handleAddIngredient = () => {
    if (!selectedInventoryId || quantityRequired <= 0) return
    const inventoryItem = inventoryItems.find((item) => item.id === selectedInventoryId)
    if (!inventoryItem) return

    setRecipe((prev) => {
      const existing = prev.find((entry) => entry.inventory_item_id === selectedInventoryId)
      if (existing) {
        return prev.map((entry) =>
          entry.inventory_item_id === selectedInventoryId
            ? { ...entry, quantity_required: quantityRequired }
            : entry
        )
      }
      return [
        ...prev,
        {
          id: `${selectedInventoryId}-${Date.now()}`,
          menu_item_id: selectedMenuItemId,
          inventory_item_id: selectedInventoryId,
          inventory_item_name: inventoryItem.name,
          inventory_item_unit: inventoryItem.unit,
          quantity_required: quantityRequired,
        },
      ]
    })
    setQuantityRequired(0)
  }

  const handleRemoveIngredient = (inventoryItemId: string) => {
    setRecipe((prev) => prev.filter((entry) => entry.inventory_item_id !== inventoryItemId))
  }

  const handleSaveRecipe = async () => {
    if (!token || !selectedMenuItemId) return
    setIsSaving(true)
    setError(null)
    try {
      await inventoryService.saveRecipeForMenuItem(
        selectedMenuItemId,
        recipe.map((entry) => ({
          inventory_item_id: entry.inventory_item_id,
          quantity_required: entry.quantity_required,
        })),
        token
      )
      setError('Recipe saved successfully.')
    } catch (err: any) {
      console.error('Failed to save recipe', err)
      setError(err?.response?.data?.message || 'Unable to save recipe mapping.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Recipe Mapping</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Link recipes to ingredients</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Define how each menu item consumes inventory so stock is adjusted automatically when orders are served.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
            <p className="text-sm text-slate-400">Mapped items</p>
            <p className="mt-3 text-3xl font-semibold text-white">{recipe.length}</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <label className="block text-sm font-medium text-slate-400">Select menu item</label>
            <select
              value={selectedMenuItemId}
              onChange={(e) => setSelectedMenuItemId(e.target.value)}
              className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <div className="mt-6 space-y-4 rounded-[1.75rem] border border-white/10 bg-[#0b1019]/80 p-4">
              <div>
                <label className="block text-sm font-medium text-slate-400">Ingredient</label>
                <select
                  value={selectedInventoryId}
                  onChange={(e) => setSelectedInventoryId(e.target.value)}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="">Choose ingredient</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400">Quantity required</label>
                <input
                  type="number"
                  step="0.01"
                  value={quantityRequired}
                  onChange={(e) => setQuantityRequired(Number(e.target.value))}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  placeholder="e.g. 0.50"
                />
              </div>

              <button
                type="button"
                onClick={handleAddIngredient}
                disabled={!selectedInventoryId || quantityRequired <= 0}
                className="inline-flex items-center justify-center rounded-3xl bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add ingredient
              </button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Recipe lines</h2>
                <p className="mt-1 text-sm text-slate-400">Define the inventory consumption for the selected menu item.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={isSaving || !selectedMenuItemId}
                className="rounded-3xl bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save recipe'}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-20 animate-pulse rounded-3xl bg-slate-950/40" />
                ))
              ) : recipe.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">No recipe mapped yet for this menu item.</div>
              ) : (
                recipe.map((line) => (
                  <div key={line.inventory_item_id} className="grid grid-cols-[1.1fr_0.7fr_0.5fr] gap-4 rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-white">
                    <div>
                      <p className="font-semibold text-white">{line.inventory_item_name}</p>
                      <p className="mt-1 text-slate-400">{line.inventory_item_unit}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{line.quantity_required.toFixed(2)}</p>
                      <p className="text-slate-400">Required</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(line.inventory_item_id)}
                      className="rounded-3xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default RecipeMapper
