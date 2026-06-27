"use client"

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from '@/context/AuthContext'
import * as inventoryService from '@/lib/services/inventoryService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AuditItem {
  inventory_item_id: string
  inventory_item_name: string
  unit: string
  opening_stock: number
  purchases: number
  consumption: number
  wastage: number
  expected_stock: number
  actual_stock: number // user physical count input
  variance?: number // actual_stock - expected_stock
  cost_impact?: number
}

export default function ReconciliationTab() {
  const { token } = useAuth()
  
  // Data states
  const [items, setItems] = useState<AuditItem[]>([])
  const [staffMember, setStaffMember] = useState('')
  const [history, setHistory] = useState<any[]>([])
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const [form, logs] = await Promise.all([
        inventoryService.getReconciliationAuditForm(token),
        inventoryService.getReconciliations(token)
      ])
      
      setItems(form.map((it: any) => ({
        ...it,
        opening_stock: Number(it.opening_stock || 0),
        purchases: Number(it.purchases || 0),
        consumption: Number(it.consumption || 0),
        wastage: Number(it.wastage || 0),
        expected_stock: Number(it.expected_stock || 0),
        actual_stock: Number(it.expected_stock || 0), // initialize physical count with expected value
        variance: 0,
        cost_impact: 0
      })))
      setHistory(logs)
    } catch (err) {
      console.error('Failed to load reconciliation data:', err)
      toast.error('Failed to load stock audit records.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData(true)
  }, [loadData])

  const handleActualStockChange = (itemId: string, value: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.inventory_item_id !== itemId) return item
        const variance = value - item.expected_stock
        const costImpact = variance * 100.0 // estimated price fallback ₹100
        return {
          ...item,
          actual_stock: value,
          variance,
          cost_impact: costImpact
        }
      })
    )
  }

  const accuracyScore = useMemo(() => {
    if (items.length === 0) return 100
    let totalVarPct = 0
    items.forEach((item) => {
      const expected = item.expected_stock === 0 ? 1 : item.expected_stock
      const pct = (Math.abs(item.variance || 0) / expected) * 100
      totalVarPct += pct
    })
    return Math.max(0, 100 - (totalVarPct / items.length))
  }, [items])

  const totalCostImpact = useMemo(() => {
    return items.reduce((sum, item) => sum + Math.abs(item.cost_impact || 0), 0)
  }, [items])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!staffMember.trim()) {
      toast.error('Auditor/Staff name is required.')
      return
    }

    try {
      setIsSaving(true)
      await inventoryService.submitReconciliation({
        staff_member: staffMember,
        items: items.map((item) => ({
          inventory_item_id: item.inventory_item_id,
          actual_stock: item.actual_stock
        }))
      }, token)

      toast.success('Stock reconciliation completed successfully!')
      setStaffMember('')
      
      // Broadcast updates
      window.dispatchEvent(new CustomEvent('inventoryUpdated'))
      loadData(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to submit reconciliation.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="bg-primary/[0.03] border-primary/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Inventory Accuracy</p>
              <h3 className={cn(
                "text-2xl font-bold mt-1",
                accuracyScore >= 98 ? 'text-emerald-500' : accuracyScore >= 90 ? 'text-amber-500' : 'text-rose-500'
              )}>
                {accuracyScore.toFixed(1)}%
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-rose-500/[0.03] border-rose-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Variance Cost</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-500">₹{totalCostImpact.toLocaleString("en-IN")}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        {/* STOCK LEDGER FORM */}
        <Card className="overflow-x-auto">
          <CardHeader>
            <CardTitle>Physical Stock Audit Form</CardTitle>
            <CardDescription>Enter verified physical stock values to adjust book levels</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading audit records...</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No active inventory items to reconcile.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Ingredient</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Purchases</TableHead>
                    <TableHead className="text-right">Consumed</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-center" style={{ width: '110px' }}>Actual Physical</TableHead>
                    <TableHead className="text-right pr-6">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const hasHighVariance = Math.abs(item.variance || 0) > (item.expected_stock * 0.05) && Math.abs(item.variance || 0) > 0.01
                    return (
                      <TableRow key={item.inventory_item_id} className="hover:bg-muted/30">
                        <td className="pl-6 font-semibold text-xs">
                          {item.inventory_item_name}
                          <span className="text-[10px] text-muted-foreground block mt-0.5">{item.unit}</span>
                        </td>
                        <td className="text-right text-xs text-muted-foreground">{item.opening_stock.toFixed(2)}</td>
                        <td className="text-right text-xs text-emerald-500">+{item.purchases.toFixed(2)}</td>
                        <td className="text-right text-xs text-sky-500">-{item.consumption.toFixed(2)}</td>
                        <td className="text-right text-xs font-bold">{item.expected_stock.toFixed(2)}</td>
                        <td className="text-center">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.actual_stock}
                            onChange={(e) => handleActualStockChange(item.inventory_item_id, parseFloat(e.target.value) || 0)}
                            className="h-8 w-20 px-2 text-center text-xs"
                          />
                        </td>
                        <td className={cn(
                          "text-right pr-6 text-xs font-bold",
                          (item.variance || 0) === 0
                            ? 'text-muted-foreground'
                            : (item.variance || 0) > 0
                            ? 'text-emerald-500'
                            : 'text-rose-500',
                          hasHighVariance && 'animate-pulse'
                        )}>
                          {(item.variance || 0) > 0 ? '+' : ''}{(item.variance || 0).toFixed(2)}
                        </td>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* SUBMISSION / HISTORY */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commit Audit</CardTitle>
              <CardDescription>Commit verified stock logs to inventory database ledger</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auditor Name / PIN</label>
                  <Input required value={staffMember} onChange={(e) => setStaffMember(e.target.value)} placeholder="e.g. Auditor Pranav" />
                </div>
                <Button type="submit" disabled={isSaving || items.length === 0} className="w-full h-10 font-semibold">
                  {isSaving ? 'Submitting audit...' : 'Commit Reconciliation'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Log</CardTitle>
              <CardDescription>Audit history archive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No previous audits completed.</p>
                ) : (
                  history.map((rec) => (
                    <div key={rec.id} className="rounded-xl border p-3 bg-muted/10 text-xs">
                      <p className="font-semibold">Date: {new Date(rec.reconciliation_date).toLocaleDateString()}</p>
                      <p className="text-muted-foreground mt-0.5">Auditor: {rec.staff_member}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Logged: {new Date(rec.created_at).toLocaleTimeString()}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
