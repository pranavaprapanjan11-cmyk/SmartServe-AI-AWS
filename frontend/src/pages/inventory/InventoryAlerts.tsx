import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import * as inventoryService from '../../services/inventoryService'
import { InventoryItem } from '../../services/inventoryService'
import { triggerLiveActivity } from '../../utils/activityTrigger'

const InventoryAlerts: React.FC = () => {
  const { token } = useAuth()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAlerts = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const lowStockItems = await inventoryService.getLowStockItems(token)
        setItems(lowStockItems)
        if (lowStockItems.length > 0) {
          triggerLiveActivity('inventoryAlert', { items: lowStockItems.slice(0, 3).map(i => i.name) })
        }
      } catch (err) {
        console.error('Failed to load inventory alerts', err)
        setError('Unable to retrieve low stock alerts.')
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [token])

  const criticalAlerts = useMemo(
    () => items.filter((item) => item.quantity_on_hand <= item.reorder_threshold * 0.5),
    [items]
  )

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-amber-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70">Inventory Alerts</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Low stock and critical warnings</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Stay ahead of shortages with real-time ingredient alerts and reorder insights.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Low stock alerts</p>
              <p className="mt-3 text-3xl font-semibold text-white">{items.length}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Critical shortages</p>
              <p className="mt-3 text-3xl font-semibold text-amber-300">{criticalAlerts.length}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <h2 className="text-lg font-semibold text-white">Current low stock</h2>
            <div className="mt-6 space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-20 animate-pulse rounded-3xl bg-slate-950/40" />
                ))
              ) : items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">No low stock alerts at the moment.</div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.4fr] gap-4 rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-white">
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="mt-1 text-slate-400">{item.description || 'No description provided.'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{item.quantity_on_hand.toFixed(2)}</p>
                      <p className="text-slate-400">On hand</p>
                    </div>
                    <div>
                      <p className="font-semibold">{item.reorder_threshold.toFixed(2)}</p>
                      <p className="text-slate-400">Reorder at</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.quantity_on_hand <= item.reorder_threshold * 0.25 ? 'bg-red-500/10 text-red-200' : 'bg-amber-500/10 text-amber-200'
                    }`}>
                      {item.quantity_on_hand <= item.reorder_threshold * 0.25 ? 'Critical' : 'Low'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <h2 className="text-lg font-semibold text-white">Action plan</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-400">
              <p>Review recipe usage to see which menu items drive most inventory consumption. Plan purchase orders for critical suppliers to refill stock before service.</p>
              <p>Highlight ingredients that need immediate procurement and schedule deliveries during low-traffic hours.</p>
              <p>Use purchase orders and supplier management together to ensure uninterrupted kitchen operations.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default InventoryAlerts
