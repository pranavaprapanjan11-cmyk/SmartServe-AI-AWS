import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { triggerLiveActivity } from '../../utils/activityTrigger'
import {
  fetchHealthScore,
  fetchInventoryForecast,
  fetchMenuInsights,
  fetchRecommendations,
  fetchSalesForecast,
  HealthScoreResponse,
  InventoryForecastItem,
  MenuInsights,
  Recommendation,
  SalesForecast,
} from '../../services/aiService'

const AIDashboard: React.FC = () => {
  const { token } = useAuth()
  const [salesForecast, setSalesForecast] = useState<SalesForecast | null>(null)
  const [inventoryForecast, setInventoryForecast] = useState<InventoryForecastItem[]>([])
  const [menuInsights, setMenuInsights] = useState<MenuInsights | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [healthScore, setHealthScore] = useState<HealthScoreResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    const load = async () => {
      try {
        const [sales, inventory, menu, recs, health] = await Promise.all([
          fetchSalesForecast(token),
          fetchInventoryForecast(token),
          fetchMenuInsights(token),
          fetchRecommendations(token),
          fetchHealthScore(token),
        ])
        setSalesForecast(sales)
        setInventoryForecast(inventory)
        setMenuInsights(menu)
        setRecommendations(recs)
        setHealthScore(health)
        triggerLiveActivity('aiInsightsReveal')
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load AI intelligence data')
      }
    }

    load()
  }, [token])

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">AI Intelligence</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Business insights & forecasting</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Actionable restaurant intelligence generated from your existing orders, billing and inventory data.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 text-right">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Health score</p>
            <p className="mt-4 text-5xl font-semibold text-white">{healthScore?.score ?? '--'}</p>
            <p className="mt-2 text-sm text-slate-400">{healthScore?.status ?? 'Loading'}</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.6fr)]">
        <div className="grid gap-6">
          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-sky-500/5 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Sales forecast</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Today', value: salesForecast?.todayRevenue },
                { label: 'Yesterday', value: salesForecast?.yesterdayRevenue },
                { label: 'This week', value: salesForecast?.weeklyRevenue },
              ].map((card) => (
                <div key={card.label} className="rounded-[1.75rem] border surface-border surface-panel p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">{card.label}</p>
                  <p className="mt-4 text-3xl font-semibold text-white">₹{card.value?.toFixed(2) ?? '--'}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Tomorrow forecast', value: salesForecast?.predictedTomorrowRevenue },
                { label: 'Weekly forecast', value: salesForecast?.predictedWeeklyRevenue },
              ].map((card) => (
                <div key={card.label} className="rounded-[1.75rem] border surface-border surface-panel p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">{card.label}</p>
                  <p className="mt-4 text-3xl font-semibold text-white">₹{card.value?.toFixed(2) ?? '--'}</p>
                </div>
              ))}
            </div>
            {salesForecast && (
              <div className="mt-6 p-4 border border-white/5 bg-slate-950/70 rounded-2xl flex justify-between items-center text-xs">
                <span className="text-slate-400">Revenue Trend (7d comparison):</span>
                <span className={`font-semibold px-2.5 py-0.5 rounded-full ${
                  salesForecast.revenueTrend?.includes('Increasing') 
                    ? 'bg-emerald-500/10 text-emerald-300' 
                    : salesForecast.revenueTrend?.includes('Decreasing') 
                    ? 'bg-rose-500/10 text-rose-300' 
                    : 'bg-slate-500/10 text-slate-300'
                }`}>
                  {salesForecast.revenueTrend ?? 'Stable'}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-emerald-500/5 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Inventory forecast</h2>
            <div className="mt-6 space-y-3">
              {inventoryForecast.slice(0, 5).map((item) => (
                <div key={item.item} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-white">{item.item}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.risk === 'HIGH'
                        ? 'bg-red-500/15 text-red-200'
                        : item.risk === 'MEDIUM'
                        ? 'bg-amber-500/15 text-amber-200'
                        : 'bg-emerald-500/15 text-emerald-200'
                    }`}>{item.risk}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">Estimated days remaining: {item.daysRemaining === 999 ? 'Low usage data' : item.daysRemaining}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-violet-500/5 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Menu insights</h2>
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                  <p className="text-sm text-slate-400">Best seller</p>
                  <p className="mt-2 text-lg font-semibold text-white">{menuInsights?.bestSeller?.name ?? '--'}</p>
                  <p className="mt-1 text-sm text-slate-400">Sold: {menuInsights?.bestSeller?.quantitySold ?? '--'}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                  <p className="text-sm text-slate-400">Worst seller (Slow moving)</p>
                  <p className="mt-2 text-lg font-semibold text-white">{menuInsights?.worstSeller?.name ?? '--'}</p>
                  <p className="mt-1 text-sm text-slate-400">Sold: {menuInsights?.worstSeller?.quantitySold ?? '--'}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                  <p className="text-sm text-slate-400">Highest revenue item</p>
                  <p className="mt-2 text-lg font-semibold text-white">{menuInsights?.highestRevenueItem?.name ?? '--'}</p>
                  <p className="mt-1 text-sm text-slate-400">Revenue: ₹{menuInsights?.highestRevenueItem?.revenue.toFixed(2) ?? '--'}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                  <p className="text-sm text-slate-400">Peak sales period</p>
                  <p className="mt-2 text-lg font-semibold text-cyan-400">{menuInsights?.peakSalesPeriod ?? '--'}</p>
                  <p className="mt-1 text-sm text-slate-400">Hour of maximum order volume</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-fuchsia-500/5 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Recommendations</h2>
            <div className="mt-6 space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                  <p className="font-semibold text-white">{rec.recommendation}</p>
                  <p className="mt-2 text-sm text-slate-400">{rec.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-amber-500/5 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Health score details</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border surface-border surface-panel p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Score</p>
                <p className="mt-4 text-4xl font-semibold text-white">{healthScore?.score ?? '--'}</p>
              </div>
              <div className="rounded-[1.75rem] border surface-border surface-panel p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Status</p>
                <p className="mt-4 text-4xl font-semibold text-white">{healthScore?.status ?? '--'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AIDashboard
