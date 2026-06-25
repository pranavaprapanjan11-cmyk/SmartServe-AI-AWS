import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import * as inventoryService from '../../services/inventoryService'
import { InventoryItem } from '../../services/inventoryService'

interface WastageRecord {
  id: string
  inventory_item_id: string
  inventory_item_name?: string
  inventory_item_unit?: string
  quantity: number
  cost: number
  reason: string
  staff_member: string
  created_at: string
}

const Wastage: React.FC = () => {
  const { token } = useAuth()
  const [wastageLogs, setWastageLogs] = useState<WastageRecord[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [monthlyWastageCost, setMonthlyWastageCost] = useState<number>(0)
  
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(0)
  const [cost, setCost] = useState<number>(0)
  const [reason, setReason] = useState<string>('')
  const [staffMember, setStaffMember] = useState<string>('')
  
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const [logs, items, analytics] = await Promise.all([
        inventoryService.getWastageList(token),
        inventoryService.getInventoryItems(token),
        inventoryService.getWastageAnalytics(token),
      ])
      setWastageLogs(logs)
      setInventoryItems(items)
      setMonthlyWastageCost(analytics.monthlyWastageCost || 0)
    } catch (err) {
      console.error('Failed to load wastage data', err)
      setError('Unable to load wastage tracking information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const handleCreateWastage = async () => {
    if (!token) return
    if (!selectedItemId || quantity <= 0 || cost <= 0 || !reason.trim() || !staffMember.trim()) {
      setError('Please fill in all wastage details correctly.')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await inventoryService.createWastage({
        inventory_item_id: selectedItemId,
        quantity,
        cost,
        reason,
        staff_member: staffMember,
      }, token)
      
      setSelectedItemId('')
      setQuantity(0)
      setCost(0)
      setReason('')
      setStaffMember('')
      
      await loadData()
    } catch (err: any) {
      console.error('Failed to record wastage', err)
      setError(err?.response?.data?.message || 'Failed to record wastage item.')
    } finally {
      setIsSaving(false)
    }
  }

  // Pre-fill cost based on item defaults when quantity changes
  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId)
    // Default estimated cost: ₹100 per unit
    if (quantity > 0) {
      setCost(Number((quantity * 100).toFixed(2)))
    }
  }

  const handleQuantityChange = (qty: number) => {
    setQuantity(qty)
    if (qty > 0) {
      setCost(Number((qty * 100).toFixed(2)))
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Wastage Management</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Track losses and kitchen waste</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Log ingredient spoilage, burnt dishes, or expired stocks to generate real-time shrinkage reports.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Monthly Wastage Cost</p>
              <p className="mt-3 text-3xl font-semibold text-rose-300">₹{monthlyWastageCost.toFixed(2)}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Shrinkage Events</p>
              <p className="mt-3 text-3xl font-semibold text-white">{wastageLogs.length}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <h2 className="text-lg font-semibold text-white">Record Wastage Event</h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400">Wasted Ingredient</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="">Select inventory item</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.unit}) - Stock: {Number(item.quantity_on_hand).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-400">Quantity Wasted</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quantity || ''}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                    placeholder="e.g. 2.50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cost || ''}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                    placeholder="e.g. 250.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="">Choose reason</option>
                  <option value="Spoiled Milk">Spoiled Milk</option>
                  <option value="Burnt Dish">Burnt Dish</option>
                  <option value="Expired Vegetables">Expired Vegetables</option>
                  <option value="Kitchen Spill">Kitchen Spill</option>
                  <option value="Customer Return">Customer Return</option>
                  <option value="Contaminated / Dropped">Contaminated / Dropped</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400">Staff Member</label>
                <input
                  type="text"
                  value={staffMember}
                  onChange={(e) => setStaffMember(e.target.value)}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  placeholder="Chef name or Manager name"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateWastage}
                disabled={isSaving || !selectedItemId || quantity <= 0}
                className="w-full inline-flex items-center justify-center rounded-3xl bg-rose-500/15 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Logging Wastage...' : 'Log wastage event'}
              </button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <h2 className="text-lg font-semibold text-white font-medium">Recent wastage events</h2>
            <div className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-20 animate-pulse rounded-3xl bg-slate-950/40" />
                ))
              ) : wastageLogs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">No wastage events logged. Shrinkage is healthy!</div>
              ) : (
                wastageLogs.map((log) => (
                  <div key={log.id} className="rounded-3xl border border-white/10 bg-[#0b1019]/80 p-4 flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white">{log.inventory_item_name}</p>
                      <p className="mt-1 text-sm text-slate-400">Reason: {log.reason}</p>
                      <p className="mt-1 text-xs text-slate-500">Logged by: {log.staff_member} on {new Date(log.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-300">- {log.quantity.toFixed(2)} {log.inventory_item_unit}</p>
                      <p className="text-xs text-slate-400">Value: ₹{log.cost.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Wastage
