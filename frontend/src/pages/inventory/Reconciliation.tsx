import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import * as inventoryService from '../../services/inventoryService'

interface AuditItem {
  inventory_item_id: string
  inventory_item_name: string
  unit: string
  opening_stock: number
  purchases: number
  consumption: number
  wastage: number
  expected_stock: number
  actual_stock: number // entered by user
  variance?: number // actual_stock - expected_stock
  cost_impact?: number
}

const Reconciliation: React.FC = () => {
  const { token } = useAuth()
  const [items, setItems] = useState<AuditItem[]>([])
  const [staffMember, setStaffMember] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadData = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const [form, logs] = await Promise.all([
        inventoryService.getReconciliationAuditForm(token),
        inventoryService.getReconciliations(token),
      ])
      
      setItems(form.map((it: any) => ({
        ...it,
        opening_stock: Number(it.opening_stock),
        purchases: Number(it.purchases),
        consumption: Number(it.consumption),
        wastage: Number(it.wastage),
        expected_stock: Number(it.expected_stock),
        actual_stock: Number(it.expected_stock), // initialize physical count with expected value
        variance: 0,
        cost_impact: 0,
      })))
      
      setHistory(logs)
    } catch (err) {
      console.error('Failed to load reconciliation data', err)
      setError('Unable to load stock count audit form.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const handleActualStockChange = (itemId: string, value: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.inventory_item_id !== itemId) return item
        const variance = value - item.expected_stock
        const costImpact = variance * 100.0 // estimated price fallback ₹100
        return {
          ...item,
          actual_stock: value,
          variance,
          cost_impact: costImpact,
        }
      })
    )
  }

  // Calculate Accuracy Score dynamically in the UI
  const accuracyScore = useMemo(() => {
    if (items.length === 0) return 100
    let totalVarPct = 0
    items.forEach((item) => {
      const expected = item.expected_stock === 0 ? 1 : item.expected_stock
      const pct = (Math.abs(item.variance || 0) / expected) * 100
      totalVarPct += pct
    })
    return Math.max(0, 100 - (totalVarPct / items.length))
  }, [items])

  const totalCostImpact = useMemo(() => {
    return items.reduce((sum, item) => sum + Math.abs(item.cost_impact || 0), 0)
  }, [items])

  const handleSubmit = async () => {
    if (!token) return
    if (!staffMember.trim()) {
      setError('Please enter the auditor/staff member name.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await inventoryService.submitReconciliation({
        staff_member: staffMember,
        items: items.map((item) => ({
          inventory_item_id: item.inventory_item_id,
          actual_stock: item.actual_stock,
        })),
      }, token)

      setSuccess('Reconciliation and variance adjustment committed successfully.')
      setStaffMember('')
      await loadData()
    } catch (err: any) {
      console.error('Failed to submit reconciliation', err)
      setError(err?.response?.data?.message || 'Failed to submit reconciliation.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Reconciliation Engine</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Physical stock audit & variance</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Perform physical stock verification. The engine automatically reconciles opening inventory, purchases, kitchen consumption, and waste, adjusting database volumes to actual verified counts.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Inventory Accuracy</p>
              <p className={`mt-3 text-3xl font-semibold ${accuracyScore >= 98 ? 'text-emerald-300' : accuracyScore >= 90 ? 'text-amber-300' : 'text-rose-300'}`}>
                {accuracyScore.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Total Variance Value</p>
              <p className="mt-3 text-3xl font-semibold text-rose-300">₹{totalCostImpact.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
        )}
        {success && (
          <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-100">{success}</div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.5fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6 overflow-x-auto">
            <h2 className="text-lg font-semibold text-white mb-4">Stock Ledger Audit Form</h2>
            {loading ? (
              <div className="py-12 text-center text-slate-400">Loading audit records...</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No active inventory items to reconcile.</div>
            ) : (
              <table className="w-full text-left text-sm text-white">
                <thead className="border-b border-white/10 bg-slate-950/80 uppercase tracking-wider text-xs text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Ingredient</th>
                    <th className="px-4 py-3 text-right">Opening</th>
                    <th className="px-4 py-3 text-right">Purchases</th>
                    <th className="px-4 py-3 text-right">Consumed</th>
                    <th className="px-4 py-3 text-right">Waste</th>
                    <th className="px-4 py-3 text-right">Expected</th>
                    <th className="px-4 py-3 text-center" style={{ width: '120px' }}>Actual Physical</th>
                    <th className="px-4 py-3 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item) => {
                    const hasHighVariance = Math.abs(item.variance || 0) > (item.expected_stock * 0.05) && Math.abs(item.variance || 0) > 0.01;
                    return (
                      <tr key={item.inventory_item_id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-4 font-medium">{item.inventory_item_name} ({item.unit})</td>
                        <td className="px-4 py-4 text-right text-slate-400">{item.opening_stock.toFixed(2)}</td>
                        <td className="px-4 py-4 text-right text-emerald-400">+{item.purchases.toFixed(2)}</td>
                        <td className="px-4 py-4 text-right text-sky-400">-{item.consumption.toFixed(2)}</td>
                        <td className="px-4 py-4 text-right text-rose-400">-{item.wastage.toFixed(2)}</td>
                        <td className="px-4 py-4 text-right text-slate-200 font-semibold">{item.expected_stock.toFixed(2)}</td>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={item.actual_stock}
                            onChange={(e) => handleActualStockChange(item.inventory_item_id, Number(e.target.value))}
                            className="w-20 rounded border border-white/10 bg-slate-950/80 px-2 py-1 text-center text-white outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className={`px-4 py-4 text-right font-bold ${
                          (item.variance || 0) === 0 
                            ? 'text-slate-400' 
                            : (item.variance || 0) > 0 
                            ? 'text-emerald-300' 
                            : 'text-rose-300'
                        } ${hasHighVariance ? 'animate-pulse' : ''}`}>
                          {(item.variance || 0) > 0 ? '+' : ''}{(item.variance || 0).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
              <h3 className="text-base font-semibold text-white">Audit Submission</h3>
              <p className="mt-2 text-xs text-slate-400">Enter auditor details to commit physical audits to database ledger.</p>
              
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs text-slate-400">Auditor Name / PIN</label>
                  <input
                    type="text"
                    value={staffMember}
                    onChange={(e) => setStaffMember(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                    placeholder="e.g. Pranav A (Manager)"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving || items.length === 0}
                  className="w-full rounded-2xl bg-cyan-500/15 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/25 disabled:opacity-50"
                >
                  {isSaving ? 'Submitting...' : 'Commit Reconciliation'}
                </button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
              <h3 className="text-base font-semibold text-white">Reconciliation Log</h3>
              <div className="mt-4 space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <p className="text-xs text-slate-500">No previous audits completed.</p>
                ) : (
                  history.map((rec) => (
                    <div key={rec.id} className="rounded-2xl border border-white/5 bg-slate-950/40 p-3 text-xs">
                      <p className="font-semibold text-white">Date: {new Date(rec.reconciliation_date).toLocaleDateString()}</p>
                      <p className="mt-1 text-slate-400">Auditor: {rec.staff_member}</p>
                      <p className="mt-1 text-slate-500">Log time: {new Date(rec.created_at).toLocaleTimeString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Reconciliation
