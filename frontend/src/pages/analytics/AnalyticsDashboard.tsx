import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAnalyticsDashboard, AnalyticsDashboard as AnalyticsDashboardModel } from '../../services/analyticsService';
import { triggerLiveActivity } from '../../utils/activityTrigger';

const metricCards = [
  { key: 'todayRevenue', label: "Today's Revenue", accent: 'from-cyan-500 to-sky-500' },
  { key: 'weekRevenue', label: 'Weekly Revenue', accent: 'from-indigo-500 to-violet-500' },
  { key: 'monthRevenue', label: 'Monthly Revenue', accent: 'from-emerald-500 to-teal-500' },
  { key: 'totalRevenue', label: 'Total Revenue', accent: 'from-amber-500 to-orange-500' },
];

const statusCards = [
  { key: 'ordersToday', label: 'Orders Today' },
  { key: 'completedOrders', label: 'Completed Orders' },
  { key: 'pendingOrders', label: 'Pending Orders' },
];

const kitchenCards = [
  { key: 'averagePrepTimeMinutes', label: 'Average Prep Time', suffix: 'min' },
  { key: 'delayedOrders', label: 'Delayed Orders' },
];

const inventoryCards = [
  { key: 'lowStockItems', label: 'Low Stock Items' },
  { key: 'inventoryAlerts', label: 'Inventory Alerts' },
];

const AnalyticsDashboard: React.FC = () => {
  const { token, sseActive } = useAuth();
  const [dashboard, setDashboard] = useState<AnalyticsDashboardModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const result = await fetchAnalyticsDashboard(token);
        setDashboard(result);
        triggerLiveActivity('analyticsCounter');
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load analytics dashboard');
      }
    };

    load();

    const onUpdate = () => {
      load();
    };

    window.addEventListener('ordersUpdated', onUpdate);
    window.addEventListener('order_created', onUpdate);
    window.addEventListener('order_updated', onUpdate);
    window.addEventListener('order_completed', onUpdate);
    window.addEventListener('order_cancelled', onUpdate);

    const pollInterval = sseActive ? 10000 : 2000;
    const iv = setInterval(onUpdate, pollInterval);

    return () => {
      window.removeEventListener('ordersUpdated', onUpdate);
      window.removeEventListener('order_created', onUpdate);
      window.removeEventListener('order_updated', onUpdate);
      window.removeEventListener('order_completed', onUpdate);
      window.removeEventListener('order_cancelled', onUpdate);
      clearInterval(iv);
    };
  }, [token, sseActive]);

  const healthBadge = useMemo(() => {
    if (!dashboard) return 'Loading';
    const score = dashboard.healthScore.score;
    if (score >= 95) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Needs Attention';
    return 'Critical';
  }, [dashboard]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Analytics Dashboard</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Restaurant performance overview</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Revenue, orders, kitchen flow, inventory status, and restaurant health score in one place.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 text-right w-64">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Health score</p>
            <p className="mt-2 text-5xl font-semibold text-white">{dashboard?.healthScore.score ?? '--'}</p>
            <p className="mt-1 text-sm text-slate-400">{dashboard?.healthScore.label ?? healthBadge}</p>
            {dashboard && (
              <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1.5 text-xs text-left">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Revenue Score:</span>
                  <span className="font-semibold text-white">{dashboard.healthScore.revenueScore}%</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Fulfillment:</span>
                  <span className="font-semibold text-white">{dashboard.healthScore.fulfillmentScore}%</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Inventory:</span>
                  <span className="font-semibold text-white">{dashboard.healthScore.inventoryScore}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard &&
            metricCards.map((card) => {
              const value =
                card.key === 'todayRevenue'
                  ? dashboard.revenue.today
                  : card.key === 'weekRevenue'
                  ? dashboard.revenue.week
                  : card.key === 'monthRevenue'
                  ? dashboard.revenue.month
                  : dashboard.revenue.total;
              return (
                <div key={card.key} className="rounded-[1.75rem] border surface-border surface-panel p-6 shadow-xl shadow-cyan-500/5">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">{card.label}</p>
                  <p className="mt-4 text-3xl font-semibold text-white">₹{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              );
            })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)]">
        <div className="grid gap-6">
          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Order analytics & status</h2>
            <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              <div className="rounded-[1.75rem] border surface-border surface-panel p-5">
                <p className="text-4xs font-extrabold uppercase tracking-widest text-slate-500">Orders Today</p>
                <p className="mt-2 text-2xl font-bold text-white">{dashboard?.orders.today ?? '--'}</p>
              </div>
              <div className="rounded-[1.75rem] border surface-border surface-panel p-5">
                <p className="text-4xs font-extrabold uppercase tracking-widest text-slate-500">Completed Orders</p>
                <p className="mt-2 text-2xl font-bold text-white">{dashboard?.orders.completed ?? '--'}</p>
              </div>
              <div className="rounded-[1.75rem] border surface-border surface-panel p-5">
                <p className="text-4xs font-extrabold uppercase tracking-widest text-slate-500">Cancelled Orders</p>
                <p className="mt-2 text-2xl font-bold text-red-400">{dashboard?.orders.cancelled ?? '--'}</p>
              </div>
              <div className="rounded-[1.75rem] border surface-border surface-panel p-5">
                <p className="text-4xs font-extrabold uppercase tracking-widest text-slate-500">Total Orders</p>
                <p className="mt-2 text-2xl font-bold text-white">{dashboard?.orders.total ?? '--'}</p>
              </div>
              <div className="rounded-[1.75rem] border surface-border surface-panel p-5 col-span-2 md:col-span-1">
                <p className="text-4xs font-extrabold uppercase tracking-widest text-slate-500">Avg Order Value</p>
                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  ₹{dashboard ? dashboard.orders.averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-sky-500/5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Kitchen performance</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Prep time & delays</h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-200">Live</span>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {kitchenCards.map((card) => {
                const value =
                  card.key === 'averagePrepTimeMinutes'
                    ? dashboard?.kitchen.averagePrepTimeMinutes
                    : dashboard?.kitchen.delayedOrders;
                return (
                  <div key={card.key} className="rounded-[1.75rem] border surface-border surface-panel p-6">
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">{card.label}</p>
                    <p className="mt-4 text-3xl font-semibold text-white">
                      {value ?? '--'}{card.suffix ? ` ${card.suffix}` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-amber-500/5 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Inventory health</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {inventoryCards.map((card) => {
                const value = card.key === 'lowStockItems' ? dashboard?.inventory.lowStockItems : dashboard?.inventory.inventoryAlerts;
                return (
                  <div key={card.key} className="rounded-[1.75rem] border surface-border surface-panel p-6">
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">{card.label}</p>
                    <p className="mt-4 text-3xl font-semibold text-white">{value ?? '--'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-violet-500/5 backdrop-blur-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Revenue trend</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Weekly revenue</h2>
              </div>
              <p className="text-sm text-slate-400">Daily payment totals</p>
            </div>
            <div className="mt-8 w-full">
              <div className="space-y-3">
                {(dashboard?.revenueTrend ?? []).map((p, idx) => {
                  const max = Math.max(...(dashboard?.revenueTrend?.map((r) => r.value) ?? [1]));
                  const pct = max > 0 ? Math.round((p.value / max) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-12 text-sm text-slate-400">{p.label}</div>
                      <div className="flex-1 bg-white/5 rounded-full h-3">
                        <div style={{ width: `${pct}%` }} className="h-3 rounded-full bg-cyan-400/70" />
                      </div>
                      <div className="w-24 text-right text-sm text-slate-400">₹{p.value.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-sky-500/5 backdrop-blur-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Orders trend</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Daily orders</h2>
              </div>
              <p className="text-sm text-slate-400">Last 7 days</p>
            </div>
            <div className="mt-8 w-full">
              <div className="space-y-3">
                {(dashboard?.ordersTrend ?? []).map((p, idx) => {
                  const max = Math.max(...(dashboard?.ordersTrend?.map((r) => r.count) ?? [1]));
                  const pct = max > 0 ? Math.round((p.count / max) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-12 text-sm text-slate-400">{p.label}</div>
                      <div className="flex-1 bg-white/5 rounded-full h-3">
                        <div style={{ width: `${pct}%` }} className="h-3 rounded-full bg-sky-400/70" />
                      </div>
                      <div className="w-12 text-right text-sm text-slate-400">{p.count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-fuchsia-500/5 backdrop-blur-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Top selling items</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Menu performance</h2>
              </div>
              <p className="text-sm text-slate-400">By sold quantity</p>
            </div>
            <div className="mt-8 w-full">
              <div className="space-y-3">
                {(dashboard?.topSellingItems ?? []).map((it, idx) => (
                  <div key={it.id || idx} className="flex items-center justify-between gap-3">
                    <div className="truncate text-sm text-slate-200">{it.name}</div>
                    <div className="text-sm text-slate-400">Sold: {it.sold}</div>
                    <div className="text-sm text-slate-400">₹{it.revenue.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-emerald-500/5 backdrop-blur-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Inventory health</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Stock condition</h2>
              </div>
              <p className="text-sm text-slate-400">Active alerts and items</p>
            </div>
            <div className="mt-8 w-full">
              <div className="space-y-3">
                {(dashboard?.inventoryHealth ?? []).map((p, idx) => {
                  const total = Math.max(1, (dashboard?.inventoryHealth?.reduce((s, x) => s + x.value, 0) ?? 1));
                  const pct = Math.round((p.value / total) * 100);
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-slate-400">{p.label}</div>
                      <div className="flex-1 bg-white/5 rounded-full h-3">
                        <div style={{ width: `${pct}%` }} className="h-3 rounded-full bg-emerald-400/70" />
                      </div>
                      <div className="w-12 text-right text-sm text-slate-400">{p.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Intelligence Section */}
      {dashboard && (
        <section className="grid gap-6 md:grid-cols-3">
          {/* Top Selling Items */}
          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-violet-500/5 backdrop-blur-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-violet-400">Menu Performance</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Top Selling Items</h2>
              </div>
            </div>
            <div className="mt-6 w-full">
              <div className="space-y-4">
                {(dashboard.topSellingItems ?? []).map((it, idx) => (
                  <div key={it.id || idx} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="truncate text-sm font-semibold text-white">{it.name}</p>
                      <p className="text-xs text-slate-400">Sold: {it.sold} units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">₹{it.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Least Selling Items */}
          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-rose-500/5 backdrop-blur-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-rose-400">Menu Performance</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Least Selling Items</h2>
              </div>
            </div>
            <div className="mt-6 w-full">
              <div className="space-y-4">
                {(dashboard.leastSellingItems ?? []).map((it, idx) => (
                  <div key={it.id || idx} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="truncate text-sm font-semibold text-white">{it.name}</p>
                      <p className="text-xs text-slate-400">Sold: {it.sold} units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-400">₹{it.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Performance */}
          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Menu Performance</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Category Analytics</h2>
              </div>
            </div>
            <div className="mt-6 w-full">
              <div className="space-y-4">
                {(dashboard.categoryPerformance ?? []).map((cat, idx) => {
                  const max = Math.max(...(dashboard.categoryPerformance?.map((c) => c.revenue) ?? [1]));
                  const pct = max > 0 ? Math.round((cat.revenue / max) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs items-end">
                        <span className="font-semibold text-white">{cat.category}</span>
                        <span className="text-slate-400">{cat.sold} sold (₹{cat.revenue.toLocaleString()})</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div style={{ width: `${pct}%` }} className="h-2 rounded-full bg-cyan-400/80" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Table & Service Performance Section */}
      {dashboard?.tableAnalytics && (
        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Table Metrics */}
          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Table Metrics</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Occupancy & Turnover</h2>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/5 bg-[#0a0f1d] p-4">
                <p className="text-4xs font-extrabold uppercase tracking-widest text-slate-500">Daily Occupancy</p>
                <p className="mt-1 text-2xl font-bold text-white">{dashboard.tableAnalytics.dailyOccupancyPercent}%</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#0a0f1d] p-4">
                <p className="text-4xs font-extrabold uppercase tracking-widest text-slate-500">Peak Occupancy</p>
                <p className="mt-1 text-2xl font-bold text-white">{dashboard.tableAnalytics.peakOccupancy} Tables</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#0a0f1d] p-4">
                <p className="text-4xs font-extrabold uppercase tracking-widest text-slate-500">Avg Turnover Time</p>
                <p className="mt-1 text-2xl font-bold text-white">{dashboard.tableAnalytics.avgTurnoverTime} min</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#0a0f1d] p-4">
                <p className="text-4xs font-extrabold uppercase tracking-widest text-slate-500">Avg Guests / Table</p>
                <p className="mt-1 text-2xl font-bold text-white">{dashboard.tableAnalytics.avgGuestCount}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-white/5 bg-[#0a0f1d] p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Most Frequently Used Table:</span>
                <span className="font-bold text-white">
                  {dashboard.tableAnalytics.mostFrequentlyUsedTable 
                    ? `Table ${dashboard.tableAnalytics.mostFrequentlyUsedTable.tableNumber} (${dashboard.tableAnalytics.mostFrequentlyUsedTable.orderCount} orders)`
                    : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fastest Turnover Table:</span>
                <span className="font-bold text-emerald-400">
                  {dashboard.tableAnalytics.fastestTurnoverTable 
                    ? `Table ${dashboard.tableAnalytics.fastestTurnoverTable.tableNumber} (${dashboard.tableAnalytics.fastestTurnoverTable.avgDuration} min)`
                    : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slowest Turnover Table:</span>
                <span className="font-bold text-rose-400">
                  {dashboard.tableAnalytics.slowestTurnoverTable 
                    ? `Table ${dashboard.tableAnalytics.slowestTurnoverTable.tableNumber} (${dashboard.tableAnalytics.slowestTurnoverTable.avgDuration} min)`
                    : 'None'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Revenue by Floor Section</p>
              <div className="space-y-2">
                {dashboard.tableAnalytics.revenueBySection.map((sec, idx) => (
                  <div key={idx} className="flex justify-between text-xs items-center">
                    <span className="text-slate-300 font-medium">{sec.section}</span>
                    <span className="font-semibold text-emerald-400">₹{sec.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Waiter Leaderboard */}
          <div className="rounded-[2rem] border surface-border surface-panel p-8 shadow-2xl shadow-indigo-500/5 backdrop-blur-xl">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300/70">Performance Leaderboard</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Waiter Performance</h2>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-extrabold uppercase tracking-widest text-[9px]">
                    <th className="py-2.5">Waiter Name</th>
                    <th className="py-2.5 text-center">Orders</th>
                    <th className="py-2.5 text-center">Tables Served</th>
                    <th className="py-2.5 text-center">Avg Service</th>
                    <th className="py-2.5 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {dashboard.tableAnalytics.waiterPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No waiter analytics logged yet</td>
                    </tr>
                  ) : (
                    dashboard.tableAnalytics.waiterPerformance.map((w, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 font-semibold text-white">{w.waiterName}</td>
                        <td className="py-3 text-center">{w.ordersCount}</td>
                        <td className="py-3 text-center">{w.tablesServed}</td>
                        <td className="py-3 text-center">{w.avgServiceDuration} min</td>
                        <td className="py-3 text-right font-bold text-emerald-400">₹{w.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
