import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import * as menuService from '../../services/menuService'

const MenuMatrix: React.FC = () => {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<menuService.MenuCategory[]>([])
  const [items, setItems] = useState<menuService.MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<menuService.MenuItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!token) return
      setIsLoading(true)
      try {
        const [categoriesData, itemsData] = await Promise.all([
          menuService.getCategories(token),
          menuService.getMenuItems(token),
        ])
        setCategories(categoriesData)
        setItems(itemsData)
        setSelectedItem(itemsData.length > 0 ? itemsData[0] : null)
      } catch (err) {
        console.error('Failed to load menu matrix', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [token])

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
        setSelectedItem(itemsData.length > 0 ? itemsData[0] : null)
        return
      }
      const itemsData = await menuService.searchMenuItems(searchQuery.trim(), selectedCategory, token)
      setItems(itemsData)
      setSelectedItem(itemsData.length > 0 ? itemsData[0] : null)
    } catch (err) {
      console.error('Menu search failed', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleDeleteItem = async (item: menuService.MenuItem) => {
    if (!token) return
    const confirmed = window.confirm(`Delete "${item.name}"? This cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)
    setDeleteError(null)
    try {
      await menuService.deleteMenuItem(item.id, token)
      setItems((prev) => prev.filter((menuItem) => menuItem.id !== item.id))
      if (selectedItem?.id === item.id) {
        setSelectedItem(null)
      }
    } catch (err) {
      console.error('Failed to delete menu item', err)
      setDeleteError('Unable to delete item. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleAvailability = async (item: menuService.MenuItem) => {
    if (!token) return
    try {
      await menuService.toggleMenuItemAvailability(item.id, !item.is_available, token)
      setItems((prev) =>
        prev.map((menuItem) =>
          menuItem.id === item.id ? { ...menuItem, is_available: !menuItem.is_available } : menuItem
        )
      )
      if (selectedItem?.id === item.id) {
        setSelectedItem({ ...item, is_available: !item.is_available })
      }
    } catch (err) {
      console.error('Failed to toggle availability', err)
    }
  }

  const categoryCounts = categories.reduce<Record<string, number>>((acc, category) => {
    acc[category.id] = items.filter((item) => item.category_id === category.id).length
    return acc
  }, {})

  const formatPrice = (price: number | string | undefined) => {
    const value = Number(price ?? 0)
    return Number.isFinite(value) ? value.toFixed(2) : '0.00'
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border surface-border surface-panel p-6 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Menu Matrix</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Unified menu operations</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Navigate categories, discover menu items, and inspect dish details without leaving the operating system.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/menu/add')}
            className="inline-flex items-center justify-center rounded-3xl bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-400/20 transition hover:bg-cyan-500/15"
          >
            + Add Menu Item
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-[1.15fr_1fr] lg:grid-cols-[1fr_1.7fr_1.2fr]">
          <div className="rounded-[1.75rem] border surface-border surface-panel p-4">
            <div className="flex items-center justify-between gap-3 px-3 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Categories</h2>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{categories.length}</span>
            </div>
            <div className="mt-3 space-y-3">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`w-full rounded-3xl px-4 py-3 text-left transition ${
                  selectedCategory === '' ? 'bg-cyan-500/15 text-cyan-200' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">All items</span>
                  <span className="text-slate-400">{items.length}</span>
                </div>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full rounded-3xl px-4 py-3 text-left transition ${
                    selectedCategory === category.id
                      ? 'bg-cyan-500/15 text-cyan-200'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{category.icon_emoji} {category.name}</p>
                      <p className="text-xs text-slate-400">{category.description || 'No description'}</p>
                    </div>
                    <span className="text-slate-400">{categoryCounts[category.id] || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Menu items</h2>
                <p className="mt-1 text-sm text-slate-500">Browse all dish cards with live availability indicators.</p>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-3xl bg-slate-950/70 px-4 py-3 shadow-inner shadow-black/10">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                  placeholder="Search menu items..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="rounded-2xl bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-3xl bg-white/5" />
                ))
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    whileHover={{ scale: 1.01 }}
                    className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                      selectedItem?.id === item.id
                        ? 'border-cyan-400/30 bg-cyan-500/10'
                        : 'border-white/10 bg-white/5 hover:border-cyan-400/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900/80 text-xl text-cyan-200">
                        {item.image_url ? '🍽️' : '📦'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-white">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-400">₹{formatPrice(item.price)} · {item.is_available ? 'Available' : 'Unavailable'}</p>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_available ? 'bg-emerald-500/10 text-emerald-200' : 'bg-slate-600/20 text-slate-300'}`}>
                        {item.is_available ? 'Active' : 'Offline'}
                      </div>
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">
                  No menu items found.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Item details</h2>
                <p className="mt-1 text-sm text-slate-500">Review and inspect menu item properties.</p>
              </div>
              <button
                type="button"
                onClick={() => selectedItem && navigate(`/menu/edit/${selectedItem.id}`)}
                disabled={!selectedItem}
                className="rounded-3xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Edit Item
              </button>
            </div>
            {selectedItem ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                  <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-slate-900">
                    {selectedItem.image_url ? (
                      <img src={selectedItem.image_url} alt={selectedItem.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-500">No image</div>
                    )}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
                  <h3 className="text-2xl font-semibold text-white">{selectedItem.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{selectedItem.description || 'No description available.'}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Price</p>
                      <p className="mt-2 text-xl font-semibold text-emerald-300">₹{formatPrice(selectedItem.price)}</p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Availability</p>
                      <p className={`mt-2 text-xl font-semibold ${selectedItem.is_available ? 'text-emerald-300' : 'text-amber-300'}`}>{selectedItem.is_available ? 'Available' : 'Unavailable'}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Category ID</p>
                      <p className="mt-2 text-sm text-slate-200">{selectedItem.category_id}</p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Bestseller</p>
                      <p className="mt-2 text-sm text-slate-200">{selectedItem.is_bestseller ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleAvailability(selectedItem)}
                  className="w-full rounded-3xl bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
                >
                  {selectedItem.is_available ? 'Mark Unavailable' : 'Mark Available'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(selectedItem)}
                  disabled={isDeleting}
                  className="w-full rounded-3xl bg-amber-500/15 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Item'}
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">
                Select a menu item to inspect its details.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default MenuMatrix
