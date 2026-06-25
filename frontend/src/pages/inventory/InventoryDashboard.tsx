import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import * as inventoryService from '../../services/inventoryService'
import * as supplierService from '../../services/supplierService'
import { InventoryItem } from '../../services/inventoryService'
import { Supplier } from '../../services/supplierService'

const InventoryDashboard: React.FC = () => {
  const { token } = useAuth()
  
  const [items, setItems] = useState<InventoryItem[]>([])
  const [lowStock, setLowStock] = useState<InventoryItem[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [wastageCost, setWastageCost] = useState<number>(0)
  const [latestRec, setLatestRec] = useState<any | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [truckAnimating, setTruckAnimating] = useState(false)
  const [crateAnimating, setCrateAnimating] = useState(false)

  const loadData = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const [itemsData, lowData, forecastData, suppliersData, wastageData, recData] = await Promise.all([
        inventoryService.getInventoryItems(token),
        inventoryService.getLowStockItems(token),
        inventoryService.getInventoryForecast(token),
        supplierService.getSuppliers(token),
        inventoryService.getWastageAnalytics(token),
        inventoryService.getLatestReconciliation(token),
      ])
      
      setItems(itemsData)
      setLowStock(lowData)
      setForecast(forecastData)
      setSuppliers(suppliersData)
      setWastageCost(wastageData.monthlyWastageCost || 0)
      setLatestRec(recData)
    } catch (err: any) {
      console.error('Failed to load inventory dashboard data', err)
      setError('Unable to compile inventory intelligence dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  // 1. Stock Overview Aggregations
  const totalValue = useMemo(() => {
    // Falls back to ₹100 per unit cost estimate
    return items.reduce((sum, item) => sum + (Number(item.quantity_on_hand) * 100), 0)
  }, [items])

  const outOfStockCount = useMemo(() => {
    return items.filter((item) => Number(item.quantity_on_hand) <= 0).length
  }, [items])

  const expiringSoonCount = useMemo(() => {
    const today = new Date()
    const limit = new Date()
    limit.setDate(today.getDate() + 7)
    
    return items.filter((item) => {
      if (!item.expiry_date) return false
      const exp = new Date(item.expiry_date)
      return exp >= today && exp <= limit
    }).length
  }, [items])

  const expiredCount = useMemo(() => {
    const today = new Date()
    return items.filter((item) => {
      if (!item.expiry_date) return false
      const exp = new Date(item.expiry_date)
      return exp < today
    }).length
  }, [items])

  const accuracyScore = useMemo(() => {
    if (latestRec && latestRec.accuracyScore !== undefined) {
      return Number(latestRec.accuracyScore)
    }
    return 98.5 // Default healthy fallback
  }, [latestRec])

  // 2. Inventory Health Score Calculation
  const healthScore = useMemo(() => {
    if (items.length === 0) return 100

    // a. Stock levels security (40% weight)
    const healthyStock = items.filter((it) => Number(it.quantity_on_hand) > Number(it.reorder_threshold)).length
    const stockPct = (healthyStock / items.length) * 100

    // b. Expiry threat (30% weight)
    const badExpiry = expiredCount + expiringSoonCount
    const expiryPct = Math.max(0, 100 - (badExpiry / items.length) * 100)

    // c. Wastage impact (15% weight)
    const wastagePct = Math.max(0, 100 - (wastageCost / 1000) * 100) // drops relative to ₹1000 threshold

    // d. Forecast stability (15% weight)
    // Items with daysRemaining > 3.0 are considered stable
    const stableItems = forecast.filter((fc) => fc.daysRemaining > 3.0).length
    const forecastPct = (stableItems / items.length) * 100

    const score = (stockPct * 0.40) + (expiryPct * 0.30) + (wastagePct * 0.15) + (forecastPct * 0.15)
    return Math.min(100, Math.max(0, Math.round(score)))
  }, [items, expiredCount, expiringSoonCount, wastageCost, forecast])

  // 3. Consumption & Movement Analytics
  const fastestMoving = useMemo(() => {
    // Sorted by daily consumption rate descending
    return [...forecast].sort((a, b) => b.dailyRate - a.dailyRate).slice(0, 3)
  }, [forecast])

  const slowestMoving = useMemo(() => {
    // Sorted by days remaining ascending (with non-zero rate) or daily rate ascending
    return [...forecast].filter((fc) => fc.dailyRate > 0).sort((a, b) => b.daysRemaining - a.daysRemaining).slice(0, 3)
  }, [forecast])

  // 4. Supplier Replenish Recommendations
  const supplierRecommendations = useMemo(() => {
    return lowStock.map((item) => {
      const itemSup = suppliers.find((s) => s.id === item.supplier_id)
      return {
        itemName: item.name,
        qty: Number(item.quantity_on_hand),
        unit: item.unit,
        supplierName: itemSup ? itemSup.name : 'Saffron Provisions (Preferred Partner)',
      }
    })
  }, [lowStock, suppliers])

  const triggerRefillAnimation = () => {
    setTruckAnimating(true)
    setTimeout(() => setTruckAnimating(false), 3000)
  }

  const triggerCrateAnimation = () => {
    setCrateAnimating(true)
    setTimeout(() => setCrateAnimating(false), 2500)
  }

  return (
    <div className="space-y-8">
      {/* Dynamic animations triggers panel */}
      <div className="flex gap-4">
        <button
          onClick={triggerRefillAnimation}
          className="rounded-3xl bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 border border-cyan-400/20 hover:bg-cyan-500/20"
        >
          🚚 Test Refill Truck
        </button>
        <button
          onClick={triggerCrateAnimation}
          className="rounded-3xl bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 border border-emerald-400/20 hover:bg-emerald-500/20"
        >
          📦 Test Crate Delivered
        </button>
      </div>

      {/* Truck Animation Overlay */}
      <AnimatePresence>
        {truckAnimating && (
          <motion.div
            initial={{ x: '-100vw' }}
            animate={{ x: '100vw' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'easeInOut' }}
            className="fixed bottom-10 left-0 z-50 pointer-events-none text-6xl"
          >
            🚚💨
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crate Delivery Overlay */}
      <AnimatePresence>
        {crateAnimating && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -45 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none bg-slate-900/90 border border-emerald-400/40 p-8 rounded-full shadow-2xl flex flex-col items-center justify-center text-center backdrop-blur-md"
          >
            <span className="text-8xl">📦</span>
            <h4 className="mt-4 text-lg font-bold text-emerald-300">STOCK DELIVERED!</h4>
            <p className="text-xs text-slate-400">Inventory Crate Unloaded Successfully</p>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-emerald-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/70">Inventory Intelligence</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Operations & shrinkage tracking</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Real-time stock depletion forecasts, daily reconciliation audits, and automated KDS inventory tracking.</p>
          </div>
          
          {/* Health Gauge Circular Progress */}
          <div className="flex items-center gap-4 rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
            <div className="relative h-20 w-20 flex items-center justify-center">
              <svg className="absolute transform -rotate-90" width="80" height="80">
                <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none"/>
                <circle cx="40" cy="40" r="32" stroke={healthScore >= 90 ? '#10b981' : healthScore >= 75 ? '#f59e0b' : '#ef4444'} strokeWidth="8" fill="none"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - healthScore / 100)}/>
              </svg>
              <span className="text-lg font-extrabold text-white">{healthScore}%</span>
            </div>
            <div>
              <p className="text-xs text-slate-400">Inventory Health</p>
              <h3 className="text-lg font-bold text-white">Score</h3>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
        )}

        {/* Stock Overview Cards Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Est Stock Value</p>
            <p className="mt-4 text-2xl font-bold text-emerald-300">₹{totalValue.toFixed(2)}</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Low Stock</p>
            <p className="mt-4 text-2xl font-bold text-white">{lowStock.length}</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Out of Stock</p>
            <p className="mt-4 text-2xl font-bold text-rose-300">{outOfStockCount}</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Expired Stock</p>
            <p className={`mt-4 text-2xl font-bold ${expiredCount > 0 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>{expiredCount}</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Audit Accuracy</p>
            <p className="mt-4 text-2xl font-bold text-cyan-300">{accuracyScore.toFixed(1)}%</p>
          </div>
        </div>
      </section>

      {/* Expiry alerts and depletion forecasting */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-white">Stock Depletion Forecasting</h2>
          <p className="mt-2 text-slate-400 text-sm">Calculated by actual daily kitchen READY consumption rate over 14 days.</p>
          
          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-16 animate-pulse rounded-3xl bg-slate-900/50" />
              ))
            ) : forecast.length === 0 ? (
              <p className="text-sm text-slate-500">No forecasting data compiled yet.</p>
            ) : (
              forecast.slice(0, 4).map((fc) => {
                const isCritical = fc.daysRemaining < 3.0;
                return (
                  <div key={fc.itemId} className="rounded-3xl border border-white/5 bg-[#0b1019]/80 p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{fc.itemName}</p>
                      <p className="text-xs text-slate-400">Daily rate: {fc.dailyRate.toFixed(2)} {fc.unit}</p>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isCritical ? 'bg-red-500/15 text-red-200 animate-pulse' : 'bg-emerald-500/10 text-emerald-200'
                      }`}>
                        {fc.daysRemaining >= 99.0 ? 'Stable Stock' : `${fc.daysRemaining.toFixed(1)} Days left`}
                      </span>
                      {fc.depletionDate && <p className="text-[10px] text-slate-500 mt-1">Depletion: {fc.depletionDate}</p>}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-white">Supplier replenishments</h2>
          <p className="mt-2 text-slate-400 text-sm">Automatic recommendations for ordering stock based on current low ingredient counts.</p>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-16 animate-pulse rounded-3xl bg-slate-900/50" />
              ))
            ) : supplierRecommendations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/5 p-8 text-center text-slate-500 text-sm">All ingredients are fully stocked. No refilling needed.</div>
            ) : (
              supplierRecommendations.slice(0, 4).map((rec, idx) => (
                <div key={idx} className="rounded-3xl border border-white/5 bg-[#0b1019]/80 p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white">{rec.itemName} low ({rec.qty.toFixed(2)} left)</p>
                    <p className="text-xs text-slate-400">Supplier: {rec.supplierName}</p>
                  </div>
                  <Link
                    to="/inventory/purchase-orders"
                    className="rounded-3xl bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                  >
                    Draft PO
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Consumption analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">Fastest Moving Ingredients</h2>
          <div className="mt-4 space-y-3">
            {fastestMoving.filter((f) => f.dailyRate > 0).map((fc, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-slate-300">{fc.itemName}</span>
                <span className="font-semibold text-emerald-300">{fc.dailyRate.toFixed(2)} {fc.unit}/day</span>
              </div>
            ))}
            {fastestMoving.filter((f) => f.dailyRate > 0).length === 0 && <p className="text-xs text-slate-500">No moving ingredients recorded today.</p>}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">Slowest Moving Ingredients</h2>
          <div className="mt-4 space-y-3">
            {slowestMoving.map((fc, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-slate-300">{fc.itemName}</span>
                <span className="font-semibold text-amber-300">{fc.daysRemaining.toFixed(0)} Days remaining</span>
              </div>
            ))}
            {slowestMoving.length === 0 && <p className="text-xs text-slate-500">All moving items are active.</p>}
          </div>
        </section>
      </div>

      {/* Expiry alerts badge lists */}
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
        <h2 className="text-2xl font-semibold text-white">Expiry Monitoring</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.75rem] border border-red-500/20 bg-red-500/5 p-5">
            <h3 className="text-sm font-bold text-red-400">EXPIRED STOCKS ({expiredCount})</h3>
            <div className="mt-3 space-y-2">
              {items.filter(it => it.expiry_date && new Date(it.expiry_date) < new Date()).map(it => (
                <p key={it.id} className="text-xs text-rose-300 font-semibold border-b border-red-500/10 pb-1 flex justify-between">
                  <span>{it.name}</span>
                  <span>Expired: {it.expiry_date}</span>
                </p>
              ))}
              {expiredCount === 0 && <p className="text-xs text-slate-500">No expired items. Stock is safe!</p>}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-amber-500/20 bg-amber-500/5 p-5">
            <h3 className="text-sm font-bold text-amber-400">EXPIRING SOON (7 Days Remaining: {expiringSoonCount})</h3>
            <div className="mt-3 space-y-2">
              {items.filter(it => {
                if (!it.expiry_date) return false
                const exp = new Date(it.expiry_date)
                const today = new Date()
                const limit = new Date()
                limit.setDate(today.getDate() + 7)
                return exp >= today && exp <= limit
              }).map(it => (
                <p key={it.id} className="text-xs text-amber-300 font-semibold border-b border-amber-500/10 pb-1 flex justify-between">
                  <span>{it.name}</span>
                  <span>Expires: {it.expiry_date}</span>
                </p>
              ))}
              {expiringSoonCount === 0 && <p className="text-xs text-slate-500">No stocks expiring this week.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Ledger Links */}
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Audit & Operations Ledger</h2>
            <p className="mt-2 text-slate-400 text-sm">Navigate to inventory configuration, supplier network registers, PO templates, and reconciliations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/inventory/items"
              className="rounded-3xl bg-cyan-500/10 px-5 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Inventory items
            </Link>
            <Link
              to="/inventory/recipes"
              className="rounded-3xl bg-cyan-500/10 px-5 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Recipe mapper
            </Link>
            <Link
              to="/inventory/suppliers"
              className="rounded-3xl bg-cyan-500/10 px-5 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Suppliers
            </Link>
            <Link
              to="/inventory/purchase-orders"
              className="rounded-3xl bg-cyan-500/10 px-5 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Purchase orders
            </Link>
            <Link
              to="/inventory/transactions"
              className="rounded-3xl bg-cyan-500/10 px-5 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Stock movements
            </Link>
            <Link
              to="/inventory/wastage"
              className="rounded-3xl bg-rose-500/15 px-5 py-2.5 text-sm text-rose-100 transition hover:bg-rose-500/25"
            >
              Wastage Records
            </Link>
            <Link
              to="/inventory/reconciliation"
              className="rounded-3xl bg-emerald-500/15 px-5 py-2.5 text-sm text-emerald-100 transition hover:bg-emerald-500/25"
            >
              Stock Audit (Reconciliation)
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default InventoryDashboard
