import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import CommandPalette from './CommandPalette'
import LiveActivityOverlay from './LiveActivityOverlay'
import SimulationCenter from '../SimulationCenter'

const AppShell: React.FC = () => {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Listen to Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Generate dynamic breadcrumbs from URL
  const getBreadcrumbs = (pathname: string) => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 0) return ['Home']

    // Map first part to category
    const categoryMap: Record<string, string> = {
      dashboard: 'Operations',
      waiter: 'Operations',
      kitchen: 'Operations',
      'digital-twin': 'Operations',
      menu: 'Restaurant',
      inventory: 'Restaurant',
      billing: 'Restaurant',
      analytics: 'Intelligence',
      ai: 'Intelligence',
      'ai-optimizer': 'Intelligence',
      employees: 'Administration',
      settings: 'Administration',
      ocr: 'Tools'
    }

    const nameMap: Record<string, string> = {
      dashboard: 'Dashboard',
      waiter: 'Orders',
      kitchen: 'Kitchen KDS',
      'digital-twin': 'Tables',
      menu: 'Menu Matrix',
      inventory: 'Inventory',
      billing: 'Billing',
      analytics: 'Analytics',
      ai: 'AI Intelligence',
      'ai-optimizer': 'AI Menu Optimizer',
      employees: 'Employees',
      settings: 'Settings',
      ocr: 'OCR Import',
      create: 'Create Order',
      items: 'Items',
      recipes: 'Recipes',
      suppliers: 'Suppliers',
      'purchase-orders': 'Purchase Orders',
      transactions: 'Movements',
      alerts: 'Low Stock Alerts',
      editor: 'Invoice Editor',
      upload: 'Upload',
      review: 'Review'
    }

    const breadcrumbs: string[] = []

    // Category parent
    const firstPart = parts[0]
    const category = categoryMap[firstPart]
    if (category) {
      breadcrumbs.push(category)
    }

    // Segments
    parts.forEach((part, index) => {
      // If it's a UUID/Database ID, display dynamic tag
      const isId = part.length > 8 && (part.match(/^[0-9a-fA-F-]+$/) || part.match(/^\d+$/))
      if (isId) {
        breadcrumbs.push(`Order #${part.substring(0, 6).toUpperCase()}`)
      } else {
        const mapped = nameMap[part] || part.charAt(0).toUpperCase() + part.slice(1)
        if (mapped !== category) {
          breadcrumbs.push(mapped)
        }
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(location.pathname)

  return (
    <div className="min-h-screen bg-[#070a13] text-white">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -left-10 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)' }}
        />
        <div
          className="absolute right-0 top-1/4 h-96 w-96 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: 'rgba(34, 211, 238, 0.10)' }}
        />
      </div>

      {/* Sidebar Drawer */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{
          paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024
            ? sidebarCollapsed ? '80px' : '260px'
            : '0px'
        }}
      >
        {/* Compact Header */}
        <Header
          onToggleSidebar={() => setMobileSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* Sub-header Navigation Bar (Breadcrumbs & Search Trigger) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 bg-slate-950/20 px-6 py-3 gap-2">
          {/* Breadcrumb links */}
          <div className="flex items-center gap-1.5 text-2xs font-semibold text-slate-400">
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={bc}>
                {idx > 0 && <span className="text-slate-600 font-bold">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-cyan-400 font-bold' : ''}>
                  {bc}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Quick Search Shortcut Bar */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-3xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition w-full sm:w-56"
          >
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search commands...</span>
            </div>
            <kbd className="rounded bg-white/5 px-1.5 py-0.5 border border-white/5 text-4xs">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Main Content Wrapper (With Transitions) */}
        <main className="flex-1 relative p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Overlays */}
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <LiveActivityOverlay />
      <SimulationCenter />
    </div>
  )
}

export default AppShell
