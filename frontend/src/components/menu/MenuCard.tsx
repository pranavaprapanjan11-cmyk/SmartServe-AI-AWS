// File: frontend/src/components/menu/MenuCard.tsx
// Premium menu item card component with modern design

import React, { useState } from 'react'
import { MenuItem } from '../../services/menuService'

interface MenuCardProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
  onToggleAvailability: (id: string, available: boolean) => void
  isLoading?: boolean
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
  isLoading = false,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(item.id)
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="group relative h-full">
      {/* Card Container */}
      <div className="h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        {/* Image Section */}
        <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Badge Overlays */}
          <div className="absolute top-3 right-3 flex gap-2">
            {item.is_bestseller && (
              <div className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                🔥 Bestseller
              </div>
            )}
            <div
              className={`${
                item.is_available
                  ? 'bg-emerald-500/90'
                  : 'bg-slate-500/90'
              } backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold`}
            >
              {item.is_available ? '✓ Available' : '✗ Unavailable'}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col">
          {/* Name and Price */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-300 transition-colors">
              {item.name}
            </h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ₹{item.price.toFixed(2)}
            </p>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-slate-300 line-clamp-2 mb-3">{item.description}</p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap gap-2 mb-4">
            {item.dietary_info && (
              <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-lg border border-blue-700/50">
                {item.dietary_info}
              </span>
            )}
            {item.preparation_time && (
              <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-1 rounded-lg border border-amber-700/50">
                ⏱ {item.preparation_time}m
              </span>
            )}
          </div>

          {/* Analytics */}
          {item.analytics && (
            <div className="grid grid-cols-3 gap-2 mb-4 py-2 border-t border-b border-slate-700">
              <div className="text-center">
                <p className="text-xs text-slate-400">Orders</p>
                <p className="text-sm font-bold text-white">{item.analytics.orders_count}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Revenue</p>
                <p className="text-sm font-bold text-green-400">₹{item.analytics.revenue.toFixed(0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Rating</p>
                <p className="text-sm font-bold text-yellow-400">⭐ {item.analytics.rating.toFixed(1)}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Toggle Availability */}
            <button
              onClick={() => onToggleAvailability(item.id, !item.is_available)}
              disabled={isLoading}
              className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                item.is_available
                  ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
                  : 'bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {item.is_available ? '🔓 Mark Unavailable' : '🔒 Mark Available'}
            </button>

            {/* Edit and Delete */}
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                disabled={isLoading}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50"
              >
                ✎ Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="flex-1 py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 border border-red-600/30"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-700 p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2">Delete Item?</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{item.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuCard
