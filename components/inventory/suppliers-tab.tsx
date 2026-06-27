"use client"

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Trash2, Edit2, ShieldAlert, Phone, Mail, MapPin, Check, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/context/AuthContext'
import * as supplierService from '@/lib/services/supplierService'
import { Supplier, SupplierPayload } from '@/lib/services/supplierService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function SuppliersTab() {
  const { token } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [isActive, setIsActive] = useState(true)
  
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadSuppliers = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const data = await supplierService.getSuppliers(token)
      setSuppliers(data)
    } catch (err) {
      console.error('Failed to load suppliers:', err)
      toast.error('Failed to load suppliers.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadSuppliers(true)
  }, [loadSuppliers])

  const activeCount = useMemo(() => suppliers.filter(s => s.is_active).length, [suppliers])
  const inactiveCount = suppliers.length - activeCount

  const resetForm = () => {
    setName('')
    setContactName('')
    setEmail('')
    setPhone('')
    setAddress('')
    setIsActive(true)
    setSelectedSupplier(null)
  }

  const handleSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setName(supplier.name)
    setContactName(supplier.contact_name || '')
    setEmail(supplier.email || '')
    setPhone(supplier.phone || '')
    setAddress(supplier.address || '')
    setIsActive(supplier.is_active)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!name.trim()) {
      toast.error('Supplier name is required.')
      return
    }

    try {
      setIsSaving(true)
      const payload: SupplierPayload = {
        name,
        contact_name: contactName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        is_active: isActive
      }
      
      if (selectedSupplier) {
        payload.id = selectedSupplier.id
      }

      await supplierService.saveSupplier(payload, token)
      toast.success(selectedSupplier ? 'Supplier updated successfully!' : 'Supplier added successfully!')
      resetForm()
      loadSuppliers(false)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to save supplier.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !selectedSupplier) return
    const confirmed = window.confirm(`Are you sure you want to delete supplier "${selectedSupplier.name}"?`)
    if (!confirmed) return
    
    try {
      await supplierService.deleteSupplier(selectedSupplier.id, token)
      toast.success('Supplier removed successfully!')
      resetForm()
      loadSuppliers(false)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to delete supplier.')
    }
  }

  const filtered = suppliers.filter(s => {
    const q = query.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contact_name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="bg-primary/[0.03] border-primary/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Suppliers</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{suppliers.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/[0.03] border-emerald-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Suppliers</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-500">{activeCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-500/[0.03] border-zinc-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Inactive Suppliers</p>
              <h3 className="text-2xl font-bold mt-1 text-muted-foreground">{inactiveCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT: ROSTER */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Supplier Roster</CardTitle>
              <CardDescription>Directory of all registered vendor partners</CardDescription>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roster..."
                className="pl-8 h-9 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-thin pr-1">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-14 animate-pulse rounded-xl bg-muted/40" />
                ))
              ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
                  No suppliers matching search criteria.
                </div>
              ) : (
                filtered.map((supplier) => (
                  <div
                    key={supplier.id}
                    onClick={() => handleSelect(supplier)}
                    className={cn(
                      "w-full rounded-xl border p-3 flex items-center justify-between gap-4 cursor-pointer transition-colors",
                      selectedSupplier?.id === supplier.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card/60 hover:bg-muted/30'
                    )}
                  >
                    <div>
                      <p className="font-semibold text-sm">{supplier.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{supplier.contact_name || 'No contact specified'}</p>
                    </div>
                    <Badge variant={supplier.is_active ? 'success' : 'secondary'} className="text-2xs font-semibold px-2 py-0.5">
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: FORM */}
        <Card>
          <CardHeader>
            <CardTitle>{selectedSupplier ? 'Edit Supplier Details' : 'Onboard Supplier'}</CardTitle>
            <CardDescription>Manage supply-chain contact details and accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supplier Name</label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Metro Wholesale Foods" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Person</label>
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. sales@metrowholesale.in" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 9988776655" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Site Address</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Sector 5, Salt Lake, Kolkata" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input bg-background focus:ring-primary"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer">
                  Active Supplier Account
                </label>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 justify-between">
                <Button type="submit" disabled={isSaving || !name.trim()} className="h-9 px-4 text-xs font-semibold">
                  {isSaving ? 'Saving...' : selectedSupplier ? 'Update Supplier' : 'Onboard Supplier'}
                </Button>
                
                {selectedSupplier && (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={resetForm} className="h-9 px-3 text-xs font-semibold">
                      Cancel
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleDelete} className="h-9 px-3 text-xs font-semibold">
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
