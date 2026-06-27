"use client"

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Trash2, Edit2, ShieldAlert, ShoppingBag, Landmark, ArrowRight, Save, ClipboardList, Info, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from '@/context/AuthContext'
import * as supplierService from '@/lib/services/supplierService'
import * as inventoryService from '@/lib/services/inventoryService'
import * as purchaseOrderService from '@/lib/services/purchaseOrderService'
import { Supplier } from '@/lib/services/supplierService'
import { InventoryItem } from '@/lib/services/inventoryService'
import { PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus } from '@/lib/services/purchaseOrderService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function PurchaseOrdersTab() {
  const { token } = useAuth()
  
  // Data lists
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  
  // Create Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [orderLines, setOrderLines] = useState<PurchaseOrderLine[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [lineQty, setLineQty] = useState<number>(0)
  const [linePrice, setLinePrice] = useState<number>(0)
  const [notes, setNotes] = useState('')
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [query, setQuery] = useState('')

  const loadData = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
    try {
      const [inventoryData, supplierData, poData] = await Promise.all([
        inventoryService.getInventoryItems(token),
        supplierService.getSuppliers(token),
        purchaseOrderService.getPurchaseOrders(token)
      ])
      setInventoryItems(inventoryData)
      setSuppliers(supplierData.filter(s => s.is_active))
      setOrders(poData)
    } catch (err) {
      console.error('Failed to load purchase order database resources:', err)
      toast.error('Failed to load purchase orders and vendor network.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData(true)
  }, [loadData])

  const totalPending = useMemo(() => {
    return orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length
  }, [orders])

  const totalValue = useMemo(() => {
    return orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  }, [orders])

  const handleAddLine = () => {
    if (!selectedItemId || lineQty <= 0 || linePrice <= 0) {
      toast.error('Please enter valid item, quantity and price.')
      return
    }
    const item = inventoryItems.find(i => i.id === selectedItemId)
    if (!item) return

    setOrderLines((prev) => {
      const existing = prev.find(l => l.inventory_item_id === selectedItemId)
      if (existing) {
        return prev.map(l =>
          l.inventory_item_id === selectedItemId
            ? { ...l, quantity: lineQty, unit_price: linePrice, total_cost: Number((lineQty * linePrice).toFixed(2)) }
            : l
        )
      }
      return [
        ...prev,
        {
          inventory_item_id: item.id,
          inventory_item_name: item.name,
          unit: item.unit,
          quantity: lineQty,
          unit_price: linePrice,
          total_cost: Number((lineQty * linePrice).toFixed(2))
        }
      ]
    })

    // Reset line fields
    setSelectedItemId('')
    setLineQty(0)
    setLinePrice(0)
  }

  const handleRemoveLine = (itemId: string) => {
    setOrderLines(prev => prev.filter(l => l.inventory_item_id !== itemId))
  }

  const handleCreateOrder = async (status: PurchaseOrderStatus = 'DRAFT') => {
    if (!token) return
    if (!selectedSupplierId || orderLines.length === 0) {
      toast.error('Please select a supplier and add at least one line item.')
      return
    }

    try {
      setSubmitting(true)
      await purchaseOrderService.createPurchaseOrder({
        supplier_id: selectedSupplierId,
        notes: notes || undefined,
        status,
        ordered_items: orderLines.map(l => ({
          inventory_item_id: l.inventory_item_id,
          quantity: l.quantity,
          unit_price: l.unit_price
        }))
      }, token)

      toast.success(status === 'SUBMITTED' ? 'Purchase order submitted successfully!' : 'Purchase order draft saved.')
      setOrderLines([])
      setSelectedSupplierId('')
      setNotes('')
      loadData(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to generate purchase order.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, status: PurchaseOrderStatus) => {
    if (!token) return
    try {
      await purchaseOrderService.updatePurchaseOrderStatus(orderId, status, token)
      toast.success(`Purchase order status updated to ${status}`)
      loadData(false)
      // Broadcast inventory update if delivered (adds stock)
      if (status === 'DELIVERED') {
        window.dispatchEvent(new CustomEvent('inventoryUpdated'))
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to update order status.')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!token) return
    const confirmed = window.confirm('Are you sure you want to delete this purchase order record?')
    if (!confirmed) return

    try {
      await purchaseOrderService.deletePurchaseOrder(orderId, token)
      toast.success('Purchase order deleted successfully.')
      loadData(false)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to delete purchase order.')
    }
  }

  const getStatusBadgeVariant = (status: PurchaseOrderStatus) => {
    if (status === 'DELIVERED') return 'success'
    if (status === 'CANCELLED') return 'danger'
    if (status === 'APPROVED') return 'info'
    if (status === 'SUBMITTED') return 'warning'
    return 'secondary'
  }

  const filteredOrders = orders.filter(o => {
    const q = query.toLowerCase()
    return (
      (o.supplier_name || '').toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="bg-primary/[0.03] border-primary/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Requisitions</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{totalPending} POs</h3>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/[0.03] border-emerald-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Orders Value</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-500">₹{totalValue.toLocaleString("en-IN")}</h3>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShoppingBag className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* CREATE PO */}
        <Card>
          <CardHeader>
            <CardTitle>Create Purchase Order</CardTitle>
            <CardDescription>Issue raw material purchase requests to suppliers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground focus:ring-primary text-sm font-medium"
              >
                <option value="">Select Supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.contact_name})</option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Material</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-card text-foreground focus:ring-primary text-xs"
                >
                  <option value="">Choose item SKU...</option>
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty</label>
                  <Input type="number" min="0" step="0.01" value={lineQty || ''} onChange={(e) => setLineQty(parseFloat(e.target.value) || 0)} className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price (₹)</label>
                  <Input type="number" min="0" step="0.01" value={linePrice || ''} onChange={(e) => setLinePrice(parseFloat(e.target.value) || 0)} className="h-9 text-xs" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="button" size="sm" onClick={handleAddLine} disabled={!selectedItemId || lineQty <= 0 || linePrice <= 0} className="gap-1">
                Add Line Item +
              </Button>
            </div>

            <div className="border border-border rounded-xl bg-muted/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-4">Material</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right pr-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderLines.map((line) => (
                    <TableRow key={line.inventory_item_id}>
                      <TableCell className="pl-4 font-medium text-xs">
                        {line.inventory_item_name}
                        <span className="text-[10px] text-muted-foreground block mt-0.5">{line.unit}</span>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{line.quantity}</TableCell>
                      <TableCell className="text-xs font-medium">₹{line.unit_price}</TableCell>
                      <TableCell className="text-right pr-4">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveLine(line.inventory_item_id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {orderLines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs italic">
                        No purchase lines added.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purchase Notes</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Urgent delivery needed before weekend rush" />
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => handleCreateOrder('DRAFT')} disabled={submitting || orderLines.length === 0}>
                Save as Draft
              </Button>
              <Button size="sm" onClick={() => handleCreateOrder('SUBMITTED')} disabled={submitting || orderLines.length === 0}>
                Submit PO
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LIST PO */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Recent Requisitions</CardTitle>
              <CardDescription>View order fulfillment statuses</CardDescription>
            </div>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter POs..."
                className="pl-7 h-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-20 animate-pulse rounded-xl bg-muted/40" />
                ))
              ) : filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-xs italic">
                  No purchase requisitions found.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border p-4 bg-card/60 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">{order.supplier_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.ordered_items?.length || 0} items · ₹{Number(order.total_amount).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Date: {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(order.status)} className="text-[10px] uppercase font-bold px-2 py-0.5">
                        {order.status}
                      </Badge>
                    </div>

                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
                        {order.status === 'DRAFT' && (
                          <Button size="sm" variant="outline" className="h-7 text-2xs" onClick={() => handleUpdateStatus(order.id, 'SUBMITTED')}>
                            Submit
                          </Button>
                        )}
                        {order.status === 'SUBMITTED' && (
                          <Button size="sm" variant="outline" className="h-7 text-2xs" onClick={() => handleUpdateStatus(order.id, 'APPROVED')}>
                            Approve
                          </Button>
                        )}
                        {order.status === 'APPROVED' && (
                          <Button size="sm" variant="default" className="h-7 text-2xs bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}>
                            Receive Stock
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 text-2xs text-muted-foreground hover:text-destructive" onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}>
                          Cancel
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-border/20 text-[10px]">
                      <span className="text-muted-foreground italic truncate max-w-[70%]">{order.notes || 'No comments'}</span>
                      <button onClick={() => handleDeleteOrder(order.id)} className="text-muted-foreground hover:text-destructive font-semibold">
                        Delete PO
                      </button>
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
