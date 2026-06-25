import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import * as inventoryService from '../../services/inventoryService'
import { InventoryItem, CreateInventoryItemPayload, UpdateInventoryItemPayload } from '../../services/inventoryService'
import { motion } from 'framer-motion'

const InventoryItems: React.FC = () => {
  const { token } = useAuth()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateInventoryItemPayload>({
    name: '',
    description: '',
    unit: 'units',
    quantity_on_hand: 0,
    reorder_threshold: 0,
    is_active: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const loadInventory = async () => {
      if (!token) return
      setIsLoading(true)
      setError(null)
      try {
        const inventory = await inventoryService.getInventoryItems(token)
        setItems(inventory)
      } catch (err) {
        console.error('Failed to load inventory items', err)
        setError('Unable to fetch inventory items.')
      } finally {
        setIsLoading(false)
      }
    }

    loadInventory()
  }, [token])

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      unit: 'units',
      quantity_on_hand: 0,
      reorder_threshold: 0,
      is_active: true,
    })
    setSelectedItem(null)
    setIsEditing(false)
  }

  const handleSelect = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsEditing(true)
    setForm({
      name: item.name,
      description: item.description ?? '',
      unit: item.unit,
      quantity_on_hand: item.quantity_on_hand,
      reorder_threshold: item.reorder_threshold,
      is_active: item.is_active,
    })
  }

  const handleChange = (field: keyof CreateInventoryItemPayload, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!token) return
    setIsSaving(true)
    setError(null)
    try {
      if (isEditing && selectedItem) {
        const updated = await inventoryService.updateInventoryItem(selectedItem.id, form as UpdateInventoryItemPayload, token)
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        setSelectedItem(updated)
      } else {
        const created = await inventoryService.createInventoryItem(form, token)
        setItems((prev) => [created, ...prev])
        setSelectedItem(created)
        setIsEditing(true)
      }
    } catch (err: any) {
      console.error('Failed to save inventory item', err)
      setError(err?.response?.data?.message || 'Unable to save inventory item.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !selectedItem) return
    const confirmed = window.confirm(`Delete inventory item "${selectedItem.name}"?`)
    if (!confirmed) return
    setIsSaving(true)
    setError(null)

    try {
      await inventoryService.deleteInventoryItem(selectedItem.id, token)
      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id))
      resetForm()
    } catch (err: any) {
      console.error('Failed to delete inventory item', err)
      setError(err?.response?.data?.message || 'Unable to delete inventory item.')
    } finally {
      setIsSaving(false)
    }
  }

  const activeCount = useMemo(() => items.filter((item) => item.is_active).length, [items])
  const lowStockCount = useMemo(
    () => items.filter((item) => item.quantity_on_hand <= item.reorder_threshold).length,
    [items]
  )

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Inventory Items</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Manage ingredient catalog</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Create, update, and retire inventory items used across recipes and purchasing workflows.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Active ingredients</p>
              <p className="mt-3 text-3xl font-semibold text-white">{activeCount}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Low stock alerts</p>
              <p className="mt-3 text-3xl font-semibold text-amber-300">{lowStockCount}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">Ingredient catalog</h2>
              <span className="rounded-full bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-400">{items.length} items</span>
            </div>

            <div className="mt-6 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-20 animate-pulse rounded-3xl bg-slate-950/40" />
                ))
              ) : items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">No inventory items available yet.</div>
              ) : (
                items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      selectedItem?.id === item.id ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-cyan-400/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-400">{item.unit} · {item.quantity_on_hand.toFixed(2)} on hand</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_active ? 'bg-emerald-500/10 text-emerald-200' : 'bg-slate-500/10 text-slate-400'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit inventory item' : 'Create new item'}</h2>
            <p className="mt-2 text-sm text-slate-400">Update item details and thresholds that affect reorder alerts and recipe mapping.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  placeholder="e.g. Turmeric Powder"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Unit</label>
                <input
                  value={form.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  placeholder="e.g. kg, litres, packs"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Quantity on hand</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.quantity_on_hand}
                    onChange={(e) => handleChange('quantity_on_hand', Number(e.target.value))}
                    className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Reorder threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.reorder_threshold}
                    onChange={(e) => handleChange('reorder_threshold', Number(e.target.value))}
                    className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  rows={4}
                  placeholder="Notes for how the ingredient is used"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-slate-900 text-cyan-500"
                  />
                  Active ingredient
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !form.name.trim()}
                    className="inline-flex items-center justify-center rounded-3xl bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : isEditing ? 'Update item' : 'Create item'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {isEditing && selectedItem && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center rounded-3xl bg-red-500/15 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete item
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default InventoryItems
