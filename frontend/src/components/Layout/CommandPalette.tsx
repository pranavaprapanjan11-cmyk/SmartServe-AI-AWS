import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { triggerLiveActivity } from '../../utils/activityTrigger'

interface CommandItem {
  id: string
  title: string
  subtitle: string
  category: string
  action: () => void
  roles?: string[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const currentRole = user?.role || ''

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      subtitle: 'View operational overview and active metrics',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'],
      action: () => { navigate('/dashboard'); onClose(); }
    },
    {
      id: 'orders',
      title: 'Go to Orders',
      subtitle: 'View all active orders and status',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER', 'WAITER'],
      action: () => { navigate('/waiter/dashboard'); onClose(); }
    },
    {
      id: 'create-order',
      title: 'Create New Order',
      subtitle: 'Take table orders and submit to kitchen',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER', 'WAITER'],
      action: () => { navigate('/waiter/orders/create'); onClose(); }
    },
    {
      id: 'kitchen',
      title: 'Go to Kitchen Display System (KDS)',
      subtitle: 'Track new orders, cooking, and ready states',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER', 'CHEF'],
      action: () => { navigate('/kitchen'); onClose(); }
    },
    {
      id: 'tables',
      title: 'Go to Tables Layout',
      subtitle: 'View restaurant tables & digital twin occupied states',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN', 'WAITER'],
      action: () => { navigate('/digital-twin'); onClose(); }
    },
    {
      id: 'menu',
      title: 'Go to Menu Matrix',
      subtitle: 'Manage dishes, categories, and analytics',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN'],
      action: () => { navigate('/menu'); onClose(); }
    },
    {
      id: 'inventory',
      title: 'Go to Inventory',
      subtitle: 'Monitor ingredients, stocks, and alerts',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'],
      action: () => { navigate('/inventory'); onClose(); }
    },
    {
      id: 'billing',
      title: 'Go to Billing',
      subtitle: 'Invoicing, receipts, and checkout management',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER', 'CASHIER'],
      action: () => { navigate('/billing'); onClose(); }
    },
    {
      id: 'analytics',
      title: 'Go to Analytics',
      subtitle: 'Deep business metrics, revenue graphs, and sales reports',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'],
      action: () => { navigate('/analytics'); onClose(); }
    },
    {
      id: 'ai-insights',
      title: 'Go to AI Intelligence',
      subtitle: 'AI sales forecasting and menu optimizations',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'],
      action: () => { navigate('/ai'); onClose(); }
    },
    {
      id: 'ai-assistant',
      title: 'Go to AI Assistant',
      subtitle: 'Interactive AI chatbot powered by Google Gemini',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'],
      action: () => { navigate('/ai-assistant'); onClose(); }
    },
    {
      id: 'employees',
      title: 'Go to Employees Management',
      subtitle: 'Manage user access, shift timing, and profiles',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN', 'MANAGER'],
      action: () => { navigate('/employees'); onClose(); }
    },
    {
      id: 'settings',
      title: 'Go to Restaurant Settings',
      subtitle: 'Configure operational hours, taxes, and profile',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN'],
      action: () => { navigate('/settings'); onClose(); }
    },
    {
      id: 'ocr',
      title: 'Go to OCR Panel',
      subtitle: 'Scan invoices and receipts automatically',
      category: 'Navigation',
      roles: ['OWNER', 'SUPER_ADMIN'],
      action: () => { navigate('/ocr'); onClose(); }
    },
    // Simulation commands
    {
      id: 'sim-new-order',
      title: 'Simulate: New Order Created',
      subtitle: 'Triggers waiter walking to kitchen animation',
      category: 'Live Activity Simulation',
      action: () => { triggerLiveActivity('orderCreated', { orderId: '1098' }); onClose(); }
    },
    {
      id: 'sim-cooking',
      title: 'Simulate: Cooking Started',
      subtitle: 'Triggers chef hat and flame animation',
      category: 'Live Activity Simulation',
      action: () => { triggerLiveActivity('cookingStarted', { orderId: '1098' }); onClose(); }
    },
    {
      id: 'sim-ready',
      title: 'Simulate: Order Ready for Pickup',
      subtitle: 'Triggers bell ring and pickup alert pulse',
      category: 'Live Activity Simulation',
      action: () => { triggerLiveActivity('orderReady', { orderId: '1098', tableNumber: 4 }); onClose(); }
    },
    {
      id: 'sim-served',
      title: 'Simulate: Order Served',
      subtitle: 'Triggers tray moving to table animation',
      category: 'Live Activity Simulation',
      action: () => { triggerLiveActivity('orderServed', { orderId: '1098', tableNumber: 4 }); onClose(); }
    },
    {
      id: 'sim-occupied',
      title: 'Simulate: Table Occupied',
      subtitle: 'Triggers table status turning from Available to Occupied',
      category: 'Live Activity Simulation',
      action: () => { triggerLiveActivity('tableOccupied', { tableNumber: 5, seats: 4 }); onClose(); }
    },
    {
      id: 'sim-available',
      title: 'Simulate: Table Available',
      subtitle: 'Triggers table status turning from Occupied to Available',
      category: 'Live Activity Simulation',
      action: () => { triggerLiveActivity('tableAvailable', { tableNumber: 5 }); onClose(); }
    },
    {
      id: 'sim-payment',
      title: 'Simulate: Payment Success',
      subtitle: 'Triggers receipt printing upward and revenue update',
      category: 'Live Activity Simulation',
      action: () => { triggerLiveActivity('paymentSuccess', { amount: 2450 }); onClose(); }
    },
    {
      id: 'sim-low-stock',
      title: 'Simulate: Inventory Alert (Low Stock)',
      subtitle: 'Triggers shaking low-stock ingredient alert',
      category: 'Live Activity Simulation',
      action: () => { triggerLiveActivity('inventoryAlert', { items: ['Rice', 'Chicken', 'Tomato'] }); onClose(); }
    },
    {
      id: 'sim-analytics',
      title: 'Simulate: Analytics Loading',
      subtitle: 'Triggers upward revenue counter animation',
      category: 'Live Activity Simulation',
      action: () => { triggerLiveActivity('analyticsCounter'); onClose(); }
    },
    {
      id: 'sim-ai-insights',
      title: 'Simulate: AI Recommendation Loading',
      subtitle: 'Triggers one-by-one card reveal animation',
      category: 'Live Activity Simulation',
      action: () => { triggerLiveActivity('aiInsightsReveal'); onClose(); }
    },
    {
      id: 'sim-notify',
      title: 'Simulate: New Notification Badge',
      subtitle: 'Triggers bell shaking and increments header badge',
      category: 'Live Activity Simulation',
      action: () => { triggerLiveActivity('notificationsBadge'); onClose(); }
    }
  ]

  // Filter commands by search term and role access
  const filteredCommands = commands.filter((cmd) => {
    // Check role access
    if (cmd.roles && !cmd.roles.includes(currentRole)) {
      return false
    }

    const matchesSearch =
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase())
    
    return matchesSearch
  })

  // Autofocus input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSearch('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands])

  // Scroll selected item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-1 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search modules..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedIndex(0)
            }}
            className="flex-1 bg-transparent text-lg text-white placeholder-slate-500 outline-none"
          />
          <kbd className="hidden rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-400 border border-white/5 sm:block">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No results found for &ldquo;<span className="text-slate-300">{search}</span>&rdquo;
            </div>
          ) : (
            <div>
              {/* Group by category */}
              {Array.from(new Set(filteredCommands.map((c) => c.category))).map((cat) => {
                const catCommands = filteredCommands.filter((c) => c.category === cat)
                return (
                  <div key={cat}>
                    <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-cyan-400/70">
                      {cat}
                    </div>
                    <div className="grid gap-1">
                      {catCommands.map((cmd) => {
                        const globalIndex = filteredCommands.findIndex((c) => c.id === cmd.id)
                        const isSelected = globalIndex === selectedIndex

                        return (
                          <button
                            key={cmd.id}
                            type="button"
                            data-active={isSelected}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-150 ${
                              isSelected
                                ? 'bg-cyan-500/15 text-white ring-1 ring-cyan-400/25'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{cmd.title}</p>
                              <p className={`truncate text-xs ${isSelected ? 'text-cyan-200/75' : 'text-slate-400'}`}>
                                {cmd.subtitle}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-white/5 border border-white/5 px-2.5 py-0.5 text-2xs text-slate-400 font-medium">
                                {cmd.category}
                              </span>
                              {isSelected && (
                                <span className="text-xs text-cyan-400">
                                  &crarr;
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
