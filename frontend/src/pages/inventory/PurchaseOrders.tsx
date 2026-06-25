import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import * as supplierService from '../../services/supplierService'
import * as inventoryService from '../../services/inventoryService'
import * as purchaseOrderService from '../../services/purchaseOrderService'
import { Supplier } from '../../services/supplierService'
import { InventoryItem } from '../../services/inventoryService'
import { PurchaseOrderLine, PurchaseOrder, PurchaseOrderStatus } from '../../services/purchaseOrderService'

const PurchaseOrders: React.FC = () => {
  const { token } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [orderLines, setOrderLines] = useState<PurchaseOrderLine[]>([])
  const [selectedLineItemId, setSelectedLineItemId] = useState<string>('')
  const [lineQuantity, setLineQuantity] = useState<number>(0)
  const [unitPrice, setUnitPrice] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const [inventoryData, supplierData, poData] = await Promise.all([
        inventoryService.getInventoryItems(token),
        supplierService.getSuppliers(token),
        purchaseOrderService.getPurchaseOrders(token),
      ])
      setInventoryItems(inventoryData)
      setSuppliers(supplierData)
      setOrders(poData)
    } catch (err) {
      console.error('Failed to load purchase orders data', err)
      setError('Unable to load purchase orders and supplier network.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const totalPending = useMemo(
    () => orders.filter((order) => order.status !== 'DELIVERED' && order.status !== 'CANCELLED').length,
    [orders]
  )
  const totalValue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total_amount), 0),
    [orders]
  )

  const handleAddLine = () => {
    if (!selectedLineItemId || lineQuantity <= 0 || unitPrice <= 0) return
    const item = inventoryItems.find((inventory) => inventory.id === selectedLineItemId)
    if (!item) return

    setOrderLines((prev) => {
      const existingLine = prev.find((line) => line.inventory_item_id === selectedLineItemId)
      if (existingLine) {
        return prev.map((line) =>
          line.inventory_item_id === selectedLineItemId
            ? { ...line, quantity: lineQuantity, unit_price: unitPrice, total_cost: Number((lineQuantity * unitPrice).toFixed(2)) }
            : line
        )
      }

      return [
        ...prev,
        {
          inventory_item_id: item.id,
          inventory_item_name: item.name,
          unit: item.unit,
          quantity: lineQuantity,
          unit_price: unitPrice,
          total_cost: Number((lineQuantity * unitPrice).toFixed(2)),
        },
      ]
    })
  }

  const handleRemoveLine = (inventoryItemId: string) => {
    setOrderLines((prev) => prev.filter((line) => line.inventory_item_id !== inventoryItemId))
  }

  const handleCreateOrder = async (status: PurchaseOrderStatus = 'DRAFT') => {
    if (!token) return
    if (!selectedSupplierId || orderLines.length === 0) {
      setError('Select a supplier and add at least one item.')
      return
    }

    try {
      setError(null)
      await purchaseOrderService.createPurchaseOrder({
        supplier_id: selectedSupplierId,
        notes,
        status,
        ordered_items: orderLines.map((line) => ({
          inventory_item_id: line.inventory_item_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
        })),
      }, token)
      
      setOrderLines([])
      setNotes('')
      setSelectedLineItemId('')
      setLineQuantity(0)
      setUnitPrice(0)
      loadData()
    } catch (err: any) {
      console.error('Failed to create purchase order', err)
      setError(err?.response?.data?.message || 'Failed to create purchase order.')
    }
  }

  const handleUpdateStatus = async (orderId: string, status: PurchaseOrderStatus) => {
    if (!token) return
    try {
      setError(null)
      await purchaseOrderService.updatePurchaseOrderStatus(orderId, status, token)
      loadData()
    } catch (err: any) {
      console.error('Failed to update PO status', err)
      setError(err?.response?.data?.message || 'Failed to update status.')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!token) return
    const confirmed = window.confirm('Delete this purchase order?')
    if (!confirmed) return
    try {
      setError(null)
      await purchaseOrderService.deletePurchaseOrder(orderId, token)
      loadData()
    } catch (err: any) {
      console.error('Failed to delete PO', err)
      setError(err?.response?.data?.message || 'Failed to delete purchase order.')
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Purchase Orders</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Requisition and delivery planning</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Create supplier purchase orders and track order status from pending to received.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Active requisitions</p>
              <p className="mt-3 text-3xl font-semibold text-white">{totalPending}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Total PO value</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-300">₹{totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <h2 className="text-lg font-semibold text-white">Create purchase order</h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400">Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-400">Inventory item</label>
                  <select
                    value={selectedLineItemId}
                    onChange={(e) => setSelectedLineItemId(e.target.value)}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  >
                    <option value="">Choose item</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lineQuantity}
                    onChange={(e) => setLineQuantity(Number(e.target.value))}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-400">Unit price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddLine}
                    disabled={!selectedLineItemId || lineQuantity <= 0 || unitPrice <= 0}
                    className="w-full rounded-3xl bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add line
                  </button>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-4">
                <h3 className="text-sm font-semibold text-white">Order lines</h3>
                {orderLines.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">Add inventory lines to build your purchase order.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {orderLines.map((line) => (
                      <div key={line.inventory_item_id} className="grid grid-cols-[1.1fr_0.5fr_0.5fr_0.4fr] gap-3 rounded-3xl border border-white/10 bg-[#0b1019]/80 px-4 py-3 text-sm text-slate-200">
                        <div>
                          <p className="font-semibold text-white">{line.inventory_item_name}</p>
                          <p className="text-slate-400">{line.unit}</p>
                        </div>
                        <div>{line.quantity.toFixed(2)}</div>
                        <div>₹{line.unit_price.toFixed(2)}</div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.inventory_item_id)}
                          className="rounded-3xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                  rows={4}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleCreateOrder('DRAFT')}
                  className="rounded-3xl bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateOrder('SUBMITTED')}
                  className="rounded-3xl bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
                >
                  Submit PO
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Recent orders</h2>
                <p className="mt-1 text-sm text-slate-400">View order status and receive goods.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-24 animate-pulse rounded-3xl bg-slate-950/40" />
                ))
              ) : orders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">No purchase orders created yet.</div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="rounded-3xl border border-white/10 bg-[#0b1019]/80 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-white">{order.supplier_name}</p>
                        <p className="mt-1 text-sm text-slate-400">{(order.ordered_items || []).length} items · ₹{Number(order.total_amount).toFixed(2)}</p>
                        <p className="mt-1 text-xs text-slate-500">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-500/10 text-emerald-200'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-500/10 text-red-200'
                          : order.status === 'APPROVED'
                          ? 'bg-cyan-500/10 text-cyan-200'
                          : 'bg-amber-500/10 text-amber-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {order.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'SUBMITTED')}
                            className="rounded-3xl bg-sky-500/15 px-4 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/25"
                          >
                            Submit
                          </button>
                        )}
                        {order.status === 'SUBMITTED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'APPROVED')}
                            className="rounded-3xl bg-purple-500/15 px-4 py-2 text-xs font-semibold text-purple-200 transition hover:bg-purple-500/25"
                          >
                            Approve
                          </button>
                        )}
                        {order.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                            className="rounded-3xl bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
                          >
                            Mark Delivered (Add Stock)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                          className="rounded-3xl bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-xs text-slate-500 hover:text-red-400 transition"
                      >
                        Delete Requisition
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PurchaseOrders
