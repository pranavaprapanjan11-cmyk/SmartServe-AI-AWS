import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as crmService from '../../services/crmService';

const WaitlistManager: React.FC = () => {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchWaitlist();
    }
  }, [token]);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      const data = await crmService.getWaitlist(token!);
      setWaitlist(data);
    } catch (err) {
      console.error('Failed to load waitlist', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await crmService.updateWaitlistStatus(id, status, token!);
      fetchWaitlist();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="flex h-full flex-col p-8 text-white overflow-y-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-400">Waitlist Queue</h1>
          <p className="mt-2 text-slate-400">Manage walk-ins waiting for a table.</p>
        </div>
        <button className="rounded-xl bg-amber-600 px-4 py-2 font-semibold hover:bg-amber-500 transition">
          + Add to Waitlist
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading waitlist...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4">Arrival Time</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Party Size</th>
                <th className="px-6 py-4">Est. Wait</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {waitlist.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Waitlist is currently empty.</td>
                </tr>
              ) : (
                waitlist.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{new Date(w.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{w.customer_name || 'Walk-in'}</div>
                      <div className="text-xs text-slate-500">{w.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{w.party_size}</td>
                    <td className="px-6 py-4 text-amber-400">{w.estimated_wait_mins} mins</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-2xs font-bold rounded-md ${w.status === 'WAITING' ? 'bg-amber-500/20 text-amber-400' : w.status === 'SEATED' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {w.status === 'WAITING' && (
                        <>
                          <button onClick={() => updateStatus(w.id, 'SEATED')} className="text-xs text-green-400 hover:text-green-300 font-semibold">Seat</button>
                          <button onClick={() => updateStatus(w.id, 'LEFT')} className="text-xs text-slate-400 hover:text-slate-300 font-semibold">Left</button>
                        </>
                      )}
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

export default WaitlistManager;
