import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as crmService from '../../services/crmService';

interface DashboardMetrics {
  totalCustomers: number;
  vipCount: number;
  atRiskCount: number;
  upcomingReservations: number;
  waitingCount: number;
  insights: string[];
}

const CRMDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchMetrics();
    }
  }, [token]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await crmService.getDashboardMetrics(token!);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load CRM metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading CRM Dashboard...</div>;
  }

  return (
    <div className="flex h-full flex-col p-8 text-white overflow-y-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-400">
            CRM & Reservation Intelligence
          </h1>
          <p className="mt-2 text-slate-400">Manage customers, loyalty, reservations, and waitlists.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <NavLink to="/crm/customers" className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md transition hover:bg-slate-800/50 hover:border-pink-500/50">
          <h3 className="text-slate-400 mb-2">Total Customers</h3>
          <p className="text-4xl font-bold text-white">{metrics?.totalCustomers}</p>
        </NavLink>
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md">
          <h3 className="text-slate-400 mb-2">VIP Customers</h3>
          <p className="text-4xl font-bold text-purple-400">{metrics?.vipCount}</p>
        </div>
        <NavLink to="/crm/reservations" className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md transition hover:bg-slate-800/50 hover:border-cyan-500/50">
          <h3 className="text-slate-400 mb-2">Upcoming Reservations</h3>
          <p className="text-4xl font-bold text-cyan-400">{metrics?.upcomingReservations}</p>
        </NavLink>
        <NavLink to="/crm/waitlist" className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md transition hover:bg-slate-800/50 hover:border-amber-500/50">
          <h3 className="text-slate-400 mb-2">Waitlist Queue</h3>
          <p className="text-4xl font-bold text-amber-400">{metrics?.waitingCount}</p>
        </NavLink>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI CRM Intelligence
          </h2>
          {metrics?.insights && metrics.insights.length > 0 ? (
            <div className="space-y-4">
              {metrics.insights.map((insight, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-pink-500/20 bg-pink-500/5 text-sm text-pink-100">
                  {insight}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No new insights generated today.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md flex flex-col justify-center items-center text-center">
           <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
           </svg>
           <h3 className="text-xl font-bold text-white mb-2">Quick Actions</h3>
           <div className="flex gap-4 mt-4">
             <NavLink to="/crm/reservations" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-full font-semibold text-sm transition">Manage Reservations</NavLink>
             <NavLink to="/crm/customers" className="px-6 py-2 bg-pink-600 hover:bg-pink-500 rounded-full font-semibold text-sm transition">View All Customers</NavLink>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
