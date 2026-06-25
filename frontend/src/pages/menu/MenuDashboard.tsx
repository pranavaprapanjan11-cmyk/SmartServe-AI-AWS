// File: frontend/src/pages/menu/MenuDashboard.tsx
// Premium menu management dashboard

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MenuCard from '../../components/menu/MenuCard'
import MenuStatsCards from '../../components/menu/MenuStats'
import * as menuService from '../../services/menuService'

const MenuDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [menuItems, setMenuItems] = useState<menuService.MenuItem[]>([])
  const [categories, setCategories] = useState<menuService.MenuCategory[]>([])
  const [stats, setStats] = useState<menuService.MenuStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  if (!token) return null

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [itemsData, categoriesData, statsData] = await Promise.all([
          menuService.getMenuItems(token),
          menuService.getCategories(token),
          menuService.getMenuStats(token),
        ])
        setMenuItems(itemsData)
        setCategories(categoriesData)
        setStats(statsData)
      } catch (err) {
        console.error('Failed to fetch menu data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token])

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || item.category_id === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [menuItems, searchQuery, selectedCategory])

  // Handle delete
  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await menuService.deleteMenuItem(id, token)
      setMenuItems(menuItems.filter((item) => item.id !== id))
    } catch (err) {
      console.error('Failed to delete menu item:', err)
    } finally {
      setIsDeleting(null)
    }
  }

  // Handle edit
  const handleEdit = (item: menuService.MenuItem) => {
    navigate(`/menu/edit/${item.id}`, { state: { item } })
  }

  // Handle toggle availability
  const handleToggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await menuService.toggleMenuItemAvailability(id, isAvailable, token)
      setMenuItems(
        menuItems.map((item) =>
          item.id === id ? { ...item, is_available: isAvailable } : item
        )
      )
    } catch (err) {
      console.error('Failed to toggle availability:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Menu Management
            </h1>
            <p className="text-slate-400">Manage your restaurant's menu items and categories</p>
          </div>
          <button
            onClick={() => navigate('/menu/add')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/50 flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-xl">➕</span>
            Add Item
          </button>
        </div>

        {/* Statistics */}
        <MenuStatsCards stats={stats} isLoading={isLoading} />

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === ''
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'text-white shadow-lg'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
                }`}
                style={
                  selectedCategory === cat.id
                    ? {
                        background: `linear-gradient(135deg, ${cat.color_code || '#3b82f6'} 0%, ${cat.color_code || '#3b82f6'}80 100%)`,
                      }
                    : {}
                }
              >
                <span>{cat.icon_emoji}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-800 rounded-2xl h-96 animate-pulse border border-slate-700"
                />
              ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <>
            <div className="text-sm text-slate-400 mb-4">
              Showing {filteredItems.length} of {menuItems.length} items
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleAvailability={handleToggleAvailability}
                  isLoading={isDeleting === item.id}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Items Found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Start by adding your first menu item'}
            </p>
            <button
              onClick={() => navigate('/menu/add')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
            >
              Add First Item
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default MenuDashboard
