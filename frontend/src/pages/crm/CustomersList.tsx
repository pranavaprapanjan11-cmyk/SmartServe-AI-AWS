import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as crmService from '../../services/crmService';

const CustomersList: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await crmService.getCustomers(token!);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (segment: string) => {
    switch(segment) {
      case 'VIP': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Frequent Visitor': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'At Risk': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'New Customer': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="flex h-full flex-col p-8 text-white overflow-y-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="mt-2 text-slate-400">View and manage customer profiles and segments.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading customers...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4">Name / Phone</th>
                <th className="px-6 py-4">Segment</th>
                <th className="px-6 py-4">Total Visits</th>
                <th className="px-6 py-4">Total Spend</th>
                <th className="px-6 py-4">Points</th>
                <th className="px-6 py-4">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No customers found.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{c.name || 'Anonymous'}</div>
                      <div className="text-xs text-slate-500">{c.phone_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full border ${getSegmentColor(c.segment)}`}>
                        {c.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4">{c.total_visits}</td>
                    <td className="px-6 py-4">₹{parseFloat(c.total_spend).toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-amber-400">{c.reward_points}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {c.last_visit ? new Date(c.last_visit).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomersList;
