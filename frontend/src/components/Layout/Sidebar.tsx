import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

interface MenuItem {
  label: string
  to: string
  icon: React.ReactNode
  roles: string[]
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { user } = useAuth()
  const currentRole = user?.role || ''

  // Modern SVG Icons for Sidebar
  const icons = {
    dashboard: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    orders: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    kitchen: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    tables: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    menu: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    inventory: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    billing: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    analytics: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    ai: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    employees: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    settings: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    ocr: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    crm: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    workspace: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  }

  const sections: MenuSection[] = [
    {
      title: 'Operations',
      items: [
        { label: 'Dashboard', to: '/dashboard', icon: icons.dashboard, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'] },
        { label: 'Orders', to: '/waiter/dashboard', icon: icons.orders, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER', 'WAITER'] },
        { label: 'Kitchen', to: '/kitchen', icon: icons.kitchen, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER', 'CHEF'] },
        { label: 'Tables', to: '/tables', icon: icons.tables, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
        { label: 'CRM & Reservations', to: '/crm', icon: icons.crm, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
      ]
    },
    {
      title: 'Restaurant',
      items: [
        { label: 'Menu', to: '/menu', icon: icons.menu, roles: ['OWNER', 'SUPER_ADMIN'] },
        { label: 'Inventory', to: '/inventory', icon: icons.inventory, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'] },
        { label: 'Billing', to: '/billing', icon: icons.billing, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER', 'CASHIER'] },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { label: 'Analytics', to: '/analytics', icon: icons.analytics, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'] },
        { label: 'AI Assistant', to: '/ai-assistant', icon: icons.ai, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'] },
        { label: 'AI Intelligence', to: '/ai', icon: icons.ai, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'] },
        { label: 'AI Operations', to: '/ai-operations', icon: icons.ai, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'] },
      ]
    },
    {
      title: 'Administration',
      items: [
        { label: 'Workspace', to: '/workspace', icon: icons.workspace, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'] },
        { label: 'Employees', to: '/employees', icon: icons.employees, roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'] },
        { label: 'Settings', to: '/settings', icon: icons.settings, roles: ['OWNER', 'SUPER_ADMIN'] },
      ]
    },
    {
      title: 'Tools',
      items: [
        { label: 'OCR Import', to: '/ocr', icon: icons.ocr, roles: ['OWNER', 'SUPER_ADMIN'] }
      ]
    }
  ]

  // Filter sections and items based on role access
  const visibleSections = sections.map(sec => {
    const items = sec.items.filter(item => item.roles.includes(currentRole))
    return { ...sec, items }
  }).filter(sec => sec.items.length > 0)

  const handleLinkClick = () => {
    setMobileOpen(false)
  }

  // Sidebar Layout Drawer content (same for Desktop & Mobile)
  const sidebarContent = (
    <div className="flex h-full flex-col surface-panel-strong border-r surface-border backdrop-blur-xl">
      {/* Header Logo */}
      <div className="flex h-16 items-center px-6 border-b surface-border gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft border border-accent-soft text-accent text-xs font-bold shadow-soft">
          OS
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <span className="font-display text-sm font-semibold text-theme-primary tracking-wide">SmartServe AI</span>
              <span className="text-4xs text-theme-muted font-bold uppercase tracking-wider">Restaurant OS</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin">
        {visibleSections.map((sec) => (
          <div key={sec.title} className="space-y-2">
            {!collapsed && (
              <h4 className="px-3 text-3xs font-extrabold uppercase tracking-widest text-theme-muted">
                {sec.title}
              </h4>
            )}
            <div className="grid gap-1">
              {sec.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `group relative flex items-center rounded-xl p-2.5 text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-accent-soft text-accent font-semibold border-l-2 border-accent'
                        : 'text-theme-secondary hover:bg-[rgba(var(--surface-3-rgb),0.6)] hover:text-theme-primary'
                    }`
                  }
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="ml-3 text-xs tracking-wide">{item.label}</span>
                  )}

                  {/* Tooltip on Collapsed Mode */}
                  {collapsed && (
                    <div className="absolute left-full top-1/2 ml-3 -translate-y-1/2 pointer-events-none rounded-lg surface-panel-strong border surface-border px-2.5 py-1 text-2xs font-semibold text-theme-primary shadow-soft opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-55">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Toggle Button */}
      <div className="hidden lg:block border-t surface-border p-4">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-xl border surface-border surface-panel py-2.5 text-theme-secondary transition hover:text-theme-primary"
        >
          <svg
            className={`h-5 w-5 transform transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop and Tablet Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed inset-y-0 left-0 z-30 hidden lg:block overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Drawer (Slide-out) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Drawer Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative flex w-64 flex-col"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
