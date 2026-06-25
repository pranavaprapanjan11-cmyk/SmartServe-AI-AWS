import React, { useState } from 'react'
import { triggerLiveActivity, ActivityType } from '../utils/activityTrigger'
import { motion, AnimatePresence } from 'framer-motion'

const SimulationCenter: React.FC = () => {
  const [open, setOpen] = useState(false)

  const simulations: { label: string; type: ActivityType; emoji: string; data?: any }[] = [
    { label: 'New Order Placed', type: 'orderCreated', emoji: '📝', data: { orderId: '1249' } },
    { label: 'Start Cooking Order', type: 'cookingStarted', emoji: '🔥', data: { orderId: '1249' } },
    { label: 'Order Ready (Bell)', type: 'orderReady', emoji: '🔔', data: { orderId: '1249', tableNumber: 4 } },
    { label: 'Order Served', type: 'orderServed', emoji: '🍽️', data: { orderId: '1249', tableNumber: 4 } },
    { label: 'Seat Customer (Green→Red)', type: 'tableOccupied', emoji: '🪑', data: { tableNumber: 3, seats: 4 } },
    { label: 'Clear Table (Red→Green)', type: 'tableAvailable', emoji: '🧼', data: { tableNumber: 3 } },
    { label: 'Payment Success (Receipt)', type: 'paymentSuccess', emoji: '💳', data: { amount: 3580 } },
    { label: 'Inventory Low Stock', type: 'inventoryAlert', emoji: '⚠️', data: { items: ['Rice', 'Chicken', 'Tomato'] } },
    { label: 'Analytics Load Counter', type: 'analyticsCounter', emoji: '📈' },
    { label: 'AI Insights Reveal', type: 'aiInsightsReveal', emoji: '🧠' },
    { label: 'Notifications Badge', type: 'notificationsBadge', emoji: '💬' },
  ]

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* Floating Toggle Icon */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/35 bg-slate-950 text-cyan-400 shadow-xl shadow-cyan-500/10 hover:bg-cyan-500/10 hover:text-white transition duration-200"
        title="Simulation Console"
      >
        <span className="text-lg">⚙️</span>
      </button>

      {/* Simulation Options Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-13 left-0 w-72 overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Activity Simulator</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-4xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <p className="text-4xs text-slate-400 leading-normal mb-3">
              Click any button to simulate real-time operations and play its corresponding micro-animation.
            </p>

            <div className="grid gap-1.5 max-h-[300px] overflow-y-auto pr-0.5">
              {simulations.map((sim) => (
                <button
                  key={sim.label}
                  type="button"
                  onClick={() => {
                    triggerLiveActivity(sim.type, sim.data)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-left text-2xs font-semibold text-slate-200 transition hover:bg-cyan-500/15 hover:text-cyan-200 hover:border-cyan-500/20"
                >
                  <span className="text-xs">{sim.emoji}</span>
                  <span className="truncate">{sim.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SimulationCenter
