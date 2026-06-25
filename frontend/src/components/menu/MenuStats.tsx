// File: frontend/src/components/menu/MenuStats.tsx
// Statistics cards component with animations

import React from 'react'
import { MenuStats } from '../../services/menuService'

interface MenuStatsProps {
  stats: MenuStats | null
  isLoading: boolean
}

export const MenuStatsCards: React.FC<MenuStatsProps> = ({ stats, isLoading }) => {
  const statCards = stats
    ? [
        {
          icon: '🍽',
          label: 'Total Items',
          value: stats.total_items,
          color: 'from-blue-600 to-blue-700',
          lightColor: 'text-blue-300',
        },
        {
          icon: '🔥',
          label: 'Bestsellers',
          value: stats.bestsellers_count,
          color: 'from-red-600 to-red-700',
          lightColor: 'text-red-300',
        },
        {
          icon: '📊',
          label: 'Categories',
          value: stats.categories_count,
          color: 'from-purple-600 to-purple-700',
          lightColor: 'text-purple-300',
        },
        {
          icon: '💰',
          label: 'Avg Price',
          value: `₹${stats.average_price.toFixed(0)}`,
          color: 'from-emerald-600 to-emerald-700',
          lightColor: 'text-emerald-300',
          isPrice: true,
        },
        {
          icon: '📈',
          label: 'Total Revenue',
          value: `₹${stats.total_revenue.toFixed(0)}`,
          color: 'from-amber-600 to-amber-700',
          lightColor: 'text-amber-300',
          isPrice: true,
        },
        {
          icon: '✅',
          label: 'Available',
          value: stats.available_items,
          color: 'from-cyan-600 to-cyan-700',
          lightColor: 'text-cyan-300',
        },
      ]
    : []

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {isLoading
        ? Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-pulse"
              >
                <div className="h-12 bg-slate-700 rounded mb-3" />
                <div className="h-8 bg-slate-700 rounded w-2/3" />
              </div>
            ))
        : statCards.map((stat, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl border border-slate-700/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{
                animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s backwards`,
              }}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              />

              {/* Glassmorphism Effect */}
              <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl" />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{stat.icon}</div>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center">
                    <div className="text-2xl">↗</div>
                  </div>
                </div>

                <p className="text-slate-400 text-sm font-medium mb-2">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.lightColor}`}>
                  {typeof stat.value === 'number' && !stat.isPrice ? (
                    <span className="tabular-nums">{stat.value}</span>
                  ) : (
                    stat.value
                  )}
                </p>
              </div>

              {/* Decorative blur elements */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-gradient-to-br ${stat.color}`}
              />
            </div>
          ))}

      {/* Highest Rated Item Card */}
      {!isLoading && stats?.highest_rated_item && (
        <div
          className="group relative overflow-hidden rounded-xl border border-slate-700/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl lg:col-span-3"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.6s backwards' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2">🌟 Highest Rated Item</p>
                <p className="text-2xl font-bold text-white">{stats.highest_rated_item.name}</p>
                <p className="text-slate-300 mt-2">
                  Rating: <span className="text-yellow-300 font-bold">⭐ N/A</span> • Price:{' '}
                  <span className="text-emerald-300 font-bold">₹{stats.highest_rated_item.price}</span>
                </p>
              </div>
              <div className="text-5xl opacity-30">⭐</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuStatsCards
