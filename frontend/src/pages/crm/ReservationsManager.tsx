import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as crmService from '../../services/crmService';
import * as tableService from '../../services/tableService';

const ReservationsManager: React.FC = () => {
  const { token } = useAuth();
  
  // State
  const [reservations, setReservations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tables, setTables] = useState<tableService.RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRes, setEditingRes] = useState<any | null>(null);
  
  // Form State
  const [phone, setPhone] = useState('');
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [selectedTable, setSelectedTable] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // SSE update listener
  useEffect(() => {
    const handleUpdate = () => {
      if (token) fetchReservationsOnly();
    };
    window.addEventListener('reservationsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('reservationsUpdated', handleUpdate);
    };
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, custData, tableData] = await Promise.all([
        crmService.getReservations(token!),
        crmService.getCustomers(token!),
        tableService.getTables(token!)
      ]);
      setReservations(resData);
      setCustomers(custData);
      setTables(tableData);
    } catch (err) {
      console.error('Failed to load reservation manager data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationsOnly = async () => {
    try {
      const resData = await crmService.getReservations(token!);
      setReservations(resData);
    } catch (err) {
      console.error('Failed to update reservations list', err);
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    // Auto lookup customer if phone is long enough
    const found = customers.find(c => c.phone_number.includes(val) || val.includes(c.phone_number));
    if (found) {
      setCustName(found.name || '');
      setCustEmail(found.email || '');
    }
  };

  const openNewModal = () => {
    setEditingRes(null);
    setPhone('');
    setCustName('');
    setCustEmail('');
    setResDate(new Date().toISOString().split('T')[0]);
    setResTime('19:00');
    setGuestCount(2);
    setSelectedTable('');
    setNotes('');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (r: any) => {
    setEditingRes(r);
    setPhone(r.phone_number || '');
    setCustName(r.customer_name || '');
    setCustEmail(r.email || '');
    setResDate(new Date(r.reservation_date).toISOString().split('T')[0]);
    setResTime(r.reservation_time.substring(0, 5));
    setGuestCount(Number(r.guest_count));
    setSelectedTable(r.requested_table || '');
    setNotes(r.notes || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!phone || !custName) {
      setFormError('Customer name and phone number are required.');
      return;
    }

    try {
      let customerId = editingRes ? editingRes.customer_id : null;
      
      if (!editingRes) {
        // Find or create customer
        const existing = customers.find(c => c.phone_number === phone.trim());
        if (existing) {
          customerId = existing.id;
        } else {
          const newCust = await crmService.createCustomer({
            name: custName,
            phone_number: phone,
            email: custEmail || undefined
          }, token!);
          customerId = newCust.id;
        }
      }

      const payload = {
        customer_id: customerId,
        reservation_date: resDate,
        reservation_time: resTime,
        guest_count: guestCount,
        requested_table: selectedTable || null,
        notes: notes || null
      };

      if (editingRes) {
        await crmService.updateReservation(editingRes.id, payload, token!);
      } else {
        await crmService.createReservation(payload, token!);
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || err.message || 'Failed to save reservation.');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await crmService.updateReservationStatus(id, status, token!);
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="flex h-full flex-col p-8 text-white overflow-y-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reservations</h1>
          <p className="mt-2 text-slate-400">Manage upcoming bookings and table seating.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="rounded-xl bg-cyan-600 px-5 py-2.5 font-semibold hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/20"
        >
          + New Reservation
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading reservations...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Guests</th>
                <th className="px-6 py-4">Table</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No upcoming reservations.</td>
                </tr>
              ) : (
                reservations.map((r) => {
                  const tableObj = tables.find(t => t.id === r.requested_table);
                  return (
                    <tr key={r.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{new Date(r.reservation_date).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-400">{r.reservation_time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{r.customer_name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{r.phone_number}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">{r.guest_count}</td>
                      <td className="px-6 py-4">
                        {tableObj ? (
                          <span className="rounded-lg bg-cyan-500/10 text-cyan-400 px-2 py-1 text-xs">
                            Table {tableObj.table_number} ({tableObj.section})
                          </span>
                        ) : (
                          <span className="text-slate-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">{r.notes || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-2xs font-bold rounded-md uppercase ${
                          r.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 
                          r.status === 'CONFIRMED' ? 'bg-cyan-500/20 text-cyan-400' : 
                          r.status === 'SEATED' ? 'bg-green-500/20 text-green-400' : 
                          r.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3 text-xs">
                        <button 
                          onClick={() => openEditModal(r)} 
                          className="text-slate-400 hover:text-white transition font-medium"
                        >
                          Edit
                        </button>
                        {r.status === 'PENDING' && (
                          <button onClick={() => updateStatus(r.id, 'CONFIRMED')} className="text-cyan-400 hover:text-cyan-300 font-semibold transition">Confirm</button>
                        )}
                        {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                          <button onClick={() => updateStatus(r.id, 'SEATED')} className="text-green-400 hover:text-green-300 font-semibold transition">Seat</button>
                        )}
                        {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                          <button onClick={() => updateStatus(r.id, 'CANCELLED')} className="text-red-400 hover:text-red-300 font-semibold transition">Cancel</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* NEW/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 space-y-4 text-slate-200">
            <h3 className="text-xl font-bold text-white mb-2">
              {editingRes ? 'Edit Booking' : 'New Reservation'}
            </h3>
            {formError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {formError}
              </div>
            )}
            
            <div className="space-y-4">
              {!editingRes && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Customer Phone</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                        placeholder="Enter phone"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Customer Name</label>
                      <input
                        type="text"
                        required
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                        placeholder="Enter name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Customer Email (Optional)</label>
                    <input
                      type="email"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Reservation Date</label>
                  <input
                    type="date"
                    required
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Reservation Time</label>
                  <input
                    type="time"
                    required
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Guest Count</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Assign Table (Optional)</label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="">-- Choose Table --</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>
                        Table {t.table_number} - Cap: {t.capacity} ({t.section})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Notes / Special Requests</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="e.g. Allergy details, window seating..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-cyan-600 text-sm font-semibold hover:bg-cyan-500 transition shadow-lg"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReservationsManager;
