import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import * as supplierService from '../../services/supplierService'
import { Supplier, SupplierPayload } from '../../services/supplierService'

const Suppliers: React.FC = () => {
  const { token } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [form, setForm] = useState<SupplierPayload>({ name: '', contact_name: '', email: '', phone: '', address: '', is_active: true })
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadSuppliers = async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await supplierService.getSuppliers(token)
      setSuppliers(data)
    } catch (err) {
      console.error('Failed to load suppliers', err)
      setError('Unable to load suppliers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [token])

  const activeCount = useMemo(() => suppliers.filter((supplier) => supplier.is_active).length, [suppliers])
  const inactiveCount = suppliers.length - activeCount

  const resetForm = () => {
    setForm({ name: '', contact_name: '', email: '', phone: '', address: '', is_active: true })
    setSelectedSupplier(null)
    setError(null)
  }

  const handleSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setForm({
      id: supplier.id,
      name: supplier.name,
      contact_name: supplier.contact_name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      is_active: supplier.is_active,
    })
  }

  const handleChange = (field: keyof SupplierPayload, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!token) return
    if (!form.name.trim()) {
      setError('Supplier name is required.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const saved = await supplierService.saveSupplier(form, token)
      setSuppliers((prev) => {
        const next = prev.filter((supplier) => supplier.id !== saved.id)
        return [saved, ...next]
      })
      setSelectedSupplier(saved)
      resetForm()
      loadSuppliers()
    } catch (err) {
      console.error('Failed to save supplier', err)
      setError('Unable to save supplier.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !selectedSupplier) return
    const confirmed = window.confirm(`Delete supplier "${selectedSupplier.name}"?`)
    if (!confirmed) return
    try {
      await supplierService.deleteSupplier(selectedSupplier.id, token)
      setSuppliers((prev) => prev.filter((supplier) => supplier.id !== selectedSupplier.id))
      resetForm()
    } catch (err) {
      console.error('Failed to delete supplier', err)
      setError('Unable to delete supplier.')
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Suppliers</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Manage vendor network</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Track supplier contacts, site information, and active vendor relationships for purchasing.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Total suppliers</p>
              <p className="mt-3 text-3xl font-semibold text-white">{suppliers.length}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Active suppliers</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-300">{activeCount}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">Supplier roster</h2>
              <span className="rounded-full bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-400">{inactiveCount} inactive</span>
            </div>
            <div className="mt-6 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-16 animate-pulse rounded-3xl bg-slate-950/40" />
                ))
              ) : suppliers.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">No suppliers available yet.</div>
              ) : (
                suppliers.map((supplier) => (
                  <button
                    key={supplier.id}
                    type="button"
                    onClick={() => handleSelect(supplier)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      selectedSupplier?.id === supplier.id ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-cyan-400/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{supplier.name}</p>
                        <p className="mt-1 text-sm text-slate-400">{supplier.contact_name || 'No contact set'}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${supplier.is_active ? 'bg-emerald-500/10 text-emerald-200' : 'bg-slate-500/10 text-slate-400'}`}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <h2 className="text-lg font-semibold text-white">{selectedSupplier ? 'Edit supplier' : 'Add supplier'}</h2>
            <p className="mt-2 text-sm text-slate-400">Capture supplier contact details for purchase and replenishment workflows.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Supplier name</label>
                <input
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Contact name</label>
                  <input
                    value={form.contact_name}
                    onChange={(e) => handleChange('contact_name', e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Email</label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Phone</label>
                  <input
                    value={form.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Address</label>
                  <input
                    value={form.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-slate-900 text-cyan-500"
                  />
                  Active supplier
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !form.name.trim()}
                  className="inline-flex items-center justify-center rounded-3xl bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : selectedSupplier ? 'Update supplier' : 'Add supplier'}
                </button>
                {selectedSupplier && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center justify-center rounded-3xl bg-red-500/15 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/25"
                  >
                    Remove supplier
                  </button>
                )}
                {selectedSupplier && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center rounded-3xl bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Suppliers
