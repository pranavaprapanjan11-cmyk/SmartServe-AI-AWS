import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'
import ThemeSwitcher from './ThemeSwitcher'

const navItems = [
  { label: 'Command Center', to: '/dashboard', roles: ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'CASHIER', 'WAITER', 'CHEF', 'SUPER_ADMIN'] },
  { label: 'Digital Twin', to: '/digital-twin', roles: ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'WAITER', 'CHEF', 'SUPER_ADMIN'] },
  { label: 'Waiter Dashboard', to: '/waiter/dashboard', roles: ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'WAITER', 'SUPER_ADMIN'] },
  { label: 'Menu Matrix', to: '/menu', roles: ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'WAITER', 'CHEF', 'SUPER_ADMIN'] },
  { label: 'Inventory', to: '/inventory', roles: ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'CHEF', 'SUPER_ADMIN'] },
  { label: 'Billing', to: '/billing', roles: ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'CASHIER', 'SUPER_ADMIN'] },
  { label: 'Analytics', to: '/analytics', roles: ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'SUPER_ADMIN'] },
  { label: 'AI Assistant', to: '/ai-assistant', roles: ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'SUPER_ADMIN'] },
  { label: 'AI Intelligence', to: '/ai', roles: ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'SUPER_ADMIN'] },
  { label: 'AI Optimizer', to: '/ai-optimizer', roles: ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'SUPER_ADMIN'] },
  { label: 'Restaurant Settings', to: '/settings', roles: ['OWNER', 'RESTAURANT_OWNER', 'SUPER_ADMIN'] },
  { label: 'OCR Panel', to: '/ocr', roles: ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'WAITER', 'CHEF', 'SUPER_ADMIN'] },
]

const TopNav: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const kitchenRoles = ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'CHEF', 'SUPER_ADMIN']
  const kitchenItem = { label: 'Kitchen', to: '/kitchen', roles: kitchenRoles }
  const visibleNavItems = React.useMemo(() => {
    if (!user) return []
    const currentRole = user.role || ''
    const items = navItems.filter((item) => item.roles.includes(currentRole))
    if (kitchenItem.roles.includes(currentRole)) {
      const idx = items.findIndex((i) => i.to === '/waiter/dashboard')
      if (idx >= 0) {
        items.splice(idx + 1, 0, kitchenItem)
      } else {
        items.push(kitchenItem)
      }
    }
    return items
  }, [user])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-x-0 top-0 z-50 border-b surface-border surface-panel-transparent backdrop-blur-xl"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 font-bold shadow-lg shadow-cyan-500/10">
            OS
          </div>
          <div className="min-w-0 max-w-[220px]">
            <p className="text-sm font-semibold text-white">SmartServe AI</p>
            <p className="truncate text-xs text-slate-400">(Restaurant Operating System)</p>
          </div>
        </div>

        <nav className="hidden flex-1 flex-wrap items-center justify-center gap-2 md:flex">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeSwitcher />

          <button
            type="button"
            onClick={() => logout()}
            className="hidden rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/15 md:inline-flex"
          >
            Sign Out
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white transition hover:bg-white/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </span>
            <span className="hidden truncate text-sm md:inline">{user?.name || 'Guest'}</span>
          </button>
        </div>
      </div>
    </motion.header>
  )
}

export default TopNav
