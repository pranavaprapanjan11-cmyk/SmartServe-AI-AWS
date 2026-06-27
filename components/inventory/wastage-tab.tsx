"use client"

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, ShieldAlert, Sparkles, AlertTriangle, ShieldCheck, HeartPulse, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/context/AuthContext'
import * as inventoryService from '@/lib/services/inventoryService'
import { InventoryItem } from '@/lib/services/inventoryService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WastageRecord {
  id: string
  inventory_item_id: string
  inventory_item_name?: string
  inventory_item_unit?: string
  quantity: number
  cost: number
  reason: string
  staff_member: string
  created_at: string
}

export default function WastageTab() {
  const { token } = useAuth()
  
  // Data lists
  const [wastageLogs, setWastageLogs] = useState<WastageRecord[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [monthlyWastageCost, setMonthlyWastageCost] = useState<number>(0)
  
  // Form states
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [cost, setCost] = useState<number>(0)
  const [reason, setReason] = useState('')
  const [staffMember, setStaffMember] = useState('')
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const [logs, items, analytics] = await Promise.all([
        inventoryService.getWastageList(token),
        inventoryService.getInventoryItems(token),
        inventoryService.getWastageAnalytics(token)
      ])
      setWastageLogs(logs)
      setInventoryItems(items)
      setMonthlyWastageCost(analytics.monthlyWastageCost || 0)
    } catch (err) {
      console.error('Failed to load wastage data:', err)
      toast.error('Failed to load wastage tracking resources.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData(true)
  }, [loadData])

  const handleCreateWastage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!selectedItemId || quantity <= 0 || cost <= 0 || !reason.trim() || !staffMember.trim()) {
      toast.error('Please enter all wastage details correctly.')
      return
    }

    try {
      setIsSaving(true)
      await inventoryService.createWastage({
        inventory_item_id: selectedItemId,
        quantity,
        cost,
        reason,
        staff_member: staffMember
      }, token)

      toast.success('Wastage logged and stock deducted!')
      setSelectedItemId('')
      setQuantity(0)
      setCost(0)
      setReason('')
      setStaffMember('')
      
      // Refresh inventory stock level alerts locally
      window.dispatchEvent(new CustomEvent('inventoryUpdated'))
      loadData(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to record wastage event.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId)
    if (quantity > 0) {
      // Default estimated cost: ₹100 fallback per unit
      setCost(Number((quantity * 100).toFixed(2)))
    }
  }

  const handleQuantityChange = (qty: number) => {
    setQuantity(qty)
    if (qty > 0) {
      // Default estimated cost: ₹100 fallback per unit
      setCost(Number((qty * 100).toFixed(2)))
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="bg-rose-500/[0.03] border-rose-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Wastage Cost</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-500">₹{monthlyWastageCost.toLocaleString("en-IN")}</h3>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="bg-primary/[0.03] border-primary/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Logged Events</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{wastageLogs.length} events</h3>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* LOG EVENT */}
        <Card>
          <CardHeader>
            <CardTitle>Log Wastage / Shrinkage</CardTitle>
            <CardDescription>Record burnt items, spills, or spoiled ingredients to adjust inventory counts</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateWastage} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ingredient SKU</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground focus:ring-primary text-sm font-medium"
                >
                  <option value="">Select ingredient...</option>
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit}) - On Hand: {i.quantity_on_hand}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity Wasted</label>
                  <Input type="number" step="0.01" value={quantity || ''} onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)} placeholder="e.g. 1.50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Est. Cost Impact (₹)</label>
                  <Input type="number" step="0.01" value={cost || ''} onChange={(e) => setCost(parseFloat(e.target.value) || 0)} placeholder="e.g. 150.00" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground focus:ring-primary text-sm font-medium"
                  >
                    <option value="">Choose reason...</option>
                    <option value="Spoiled Milk">Spoiled Milk</option>
                    <option value="Burnt Dish">Burnt Dish</option>
                    <option value="Expired Vegetables">Expired Vegetables</option>
                    <option value="Kitchen Spill">Kitchen Spill</option>
                    <option value="Customer Return">Customer Return</option>
                    <option value="Contaminated / Dropped">Contaminated / Dropped</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Audited By (Staff Member)</label>
                  <Input value={staffMember} onChange={(e) => setStaffMember(e.target.value)} placeholder="e.g. Chef Pranav" />
                </div>
              </div>

              <Button type="submit" disabled={isSaving || !selectedItemId || quantity <= 0} className="w-full h-10 font-semibold gap-1.5 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25 border-rose-500/20">
                {isSaving ? 'Logging wastage...' : 'Commit Wastage & Deduct Stock'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* LOG ROSTER */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Wastage Events</CardTitle>
            <CardDescription>Shrinkage logs committed to audit trail</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-16 animate-pulse rounded-xl bg-muted/40" />
                ))
              ) : wastageLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-xs italic">
                  No wastage events logged. Shrinkage is healthy!
                </div>
              ) : (
                wastageLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border p-3.5 bg-card/60 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm">{log.inventory_item_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Reason: {log.reason}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" /> {log.staff_member} on {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs text-rose-400">-{log.quantity} {log.inventory_item_unit}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Valued: ₹{log.cost}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
