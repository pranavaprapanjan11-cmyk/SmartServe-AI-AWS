import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import * as inventoryService from '../../services/inventoryService'

interface StockMovement {
  id: string
  created_at: string
  change_amount: number
  transaction_type: string
  note: string
  inventory_item_name?: string
  unit?: string
}

const StockMovements: React.FC = () => {
  const { token } = useAuth()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMovements = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await inventoryService.getTransactions(token)
      setMovements(data)
    } catch (err) {
      console.error('Failed to load stock movements data', err)
      setError('Unable to load stock movement history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMovements()
  }, [token])

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Stock Movements</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Inventory transaction ledger</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Review stock movement events derived from purchase orders, kitchen production, wastage, and reconciliation audits.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
            <p className="text-sm text-slate-400">Tracked movements</p>
            <p className="mt-3 text-3xl font-semibold text-white">{movements.length}</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
        )}

        <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80">
          <div className="grid grid-cols-5 gap-4 border-b border-white/10 bg-slate-950/80 px-6 py-4 text-sm uppercase tracking-[0.35em] text-slate-500">
            <span>Date / Time</span>
            <span>Item</span>
            <span>Quantity</span>
            <span>Type</span>
            <span>Note</span>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-16 animate-pulse bg-slate-950/40" />
              ))
            ) : movements.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No stock movements recorded yet. Trigger kitchen ready state or PO delivery to create ledger entries.</div>
            ) : (
              movements.map((movement) => (
                <div key={movement.id} className="grid grid-cols-5 gap-4 px-6 py-4 text-sm text-white">
                  <span>{new Date(movement.created_at).toLocaleString()}</span>
                  <span>{movement.inventory_item_name}</span>
                  <span className={`font-semibold ${Number(movement.change_amount) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {Number(movement.change_amount) >= 0 ? '+' : ''}{Number(movement.change_amount).toFixed(2)} {movement.unit}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold w-fit ${
                    movement.transaction_type === 'STOCK_IN'
                      ? 'bg-emerald-500/10 text-emerald-200'
                      : movement.transaction_type === 'STOCK_OUT'
                      ? 'bg-sky-500/10 text-sky-200'
                      : movement.transaction_type === 'WASTE'
                      ? 'bg-red-500/10 text-red-200'
                      : 'bg-amber-500/10 text-amber-200'
                  }`}>
                    {movement.transaction_type}
                  </span>
                  <span className="text-slate-400 truncate max-w-[200px]" title={movement.note}>{movement.note}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default StockMovements
