// File: frontend/src/pages/menu/EditMenuItem.tsx
// Premium edit menu item form

import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import * as menuService from '../../services/menuService'

const EditMenuItem: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { token } = useAuth()

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    image_url: '',
    preparation_time: '',
    spice_level: '0',
    dietary_info: '',
    calories: '',
    is_available: true,
    is_bestseller: false,
  })

  const [categories, setCategories] = useState<menuService.MenuCategory[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingItem, setIsLoadingItem] = useState(true)

  if (!token || !id) return null

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get categories
        const categoriesData = await menuService.getCategories(token)
        setCategories(categoriesData)

        // Get menu item
        let menuItem: menuService.MenuItem
        if (location.state?.item) {
          menuItem = location.state.item
        } else {
          menuItem = await menuService.getMenuItemById(id, token)
        }

        setFormData({
          category_id: menuItem.category_id,
          name: menuItem.name,
          description: menuItem.description || '',
          price: menuItem.price.toString(),
          image_url: menuItem.image_url || '',
          preparation_time: menuItem.preparation_time?.toString() || '',
          spice_level: (menuItem.spice_level || 0).toString(),
          dietary_info: menuItem.dietary_info || '',
          calories: menuItem.calories?.toString() || '',
          is_available: menuItem.is_available,
          is_bestseller: menuItem.is_bestseller,
        })
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setErrors({ submit: 'Failed to load menu item' })
      } finally {
        setIsLoadingCategories(false)
        setIsLoadingItem(false)
      }
    }

    fetchData()
  }, [token, id])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.category_id) newErrors.category_id = 'Category is required'
    if (!formData.name.trim()) newErrors.name = 'Item name is required'
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const payload: menuService.UpdateMenuItemPayload = {
        category_id: formData.category_id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        image_url: formData.image_url.trim() || undefined,
        preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : undefined,
        spice_level: parseInt(formData.spice_level),
        dietary_info: formData.dietary_info || undefined,
        calories: formData.calories ? parseInt(formData.calories) : undefined,
        is_available: formData.is_available,
        is_bestseller: formData.is_bestseller,
      }

      await menuService.updateMenuItem(id, payload, token)
      navigate('/menu')
    } catch (err: any) {
      console.error('Failed to update menu item:', err)
      setErrors({ submit: err.response?.data?.message || 'Failed to update menu item' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingItem || isLoadingCategories) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-slate-300">Loading menu item...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <span>←</span> Back to Menu
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Edit Menu Item
          </h1>
          <p className="text-slate-400">Update item details</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-600/20 border border-red-600/50 rounded-lg text-red-300">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.category_id ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon_emoji} {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-400 text-sm mt-1">{errors.category_id}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Chicken Biryani"
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.name ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your menu item..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.price ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Grid: Prep Time & Spice Level */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Preparation Time (min)
                </label>
                <input
                  type="number"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                  placeholder="30"
                  min="0"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Spice Level
                </label>
                <select
                  value={formData.spice_level}
                  onChange={(e) => setFormData({ ...formData, spice_level: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="0">🟢 None</option>
                  <option value="1">🟡 Mild</option>
                  <option value="2">🟠 Medium</option>
                  <option value="3">🔴 Hot</option>
                  <option value="4">🔥 Extra Hot</option>
                </select>
              </div>
            </div>

            {/* Dietary Info & Calories */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Dietary Info
                </label>
                <select
                  value={formData.dietary_info}
                  onChange={(e) => setFormData({ ...formData, dietary_info: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">None</option>
                  <option value="VEGETARIAN">Vegetarian</option>
                  <option value="VEGAN">Vegan</option>
                  <option value="GLUTEN_FREE">Gluten Free</option>
                  <option value="DAIRY_FREE">Dairy Free</option>
                  <option value="NUT_FREE">Nut Free</option>
                  <option value="HALAL">Halal</option>
                  <option value="KOSHER">Kosher</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Calories
                </label>
                <input
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-white font-medium">Available for order</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_bestseller}
                  onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-white font-medium">Mark as bestseller 🔥</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditMenuItem
