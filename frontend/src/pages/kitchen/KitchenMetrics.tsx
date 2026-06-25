import React from 'react'
import * as orderService from '../../services/orderService'
import * as kitchenService from '../../services/kitchenService'

type Props = {
  orders: orderService.Order[]
}

const KitchenMetrics: React.FC<Props> = ({ orders }) => {
  const active = orders.filter(o => o.status !== orderService.OrderStatus.PAID).length
  const preparing = orders.filter(o => o.status === orderService.OrderStatus.PREPARING || o.status === orderService.OrderStatus.SENT_TO_KITCHEN).length
  const ready = orders.filter(o => o.status === orderService.OrderStatus.READY).length
  const delayed = orders.filter(o => kitchenService.elapsedMinutes(o) > 15).length
  const avg = kitchenService.averagePrepMinutes(orders)

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-4">
        <p className="text-xs text-slate-400 uppercase">Active Orders</p>
        <p className="mt-2 text-3xl font-semibold text-cyan-300">{active}</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-4">
        <p className="text-xs text-slate-400 uppercase">Preparing</p>
        <p className="mt-2 text-3xl font-semibold text-amber-300">{preparing}</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-4">
        <p className="text-xs text-slate-400 uppercase">Ready</p>
        <p className="mt-2 text-3xl font-semibold text-emerald-300">{ready}</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-4">
        <p className="text-xs text-slate-400 uppercase">Delayed (&gt;15m)</p>
        <p className="mt-2 text-3xl font-semibold text-amber-400">{delayed}</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-4">
        <p className="text-xs text-slate-400 uppercase">Avg Prep Time</p>
        <p className="mt-2 text-3xl font-semibold text-white">{avg}m</p>
      </div>
    </div>
  )
}

export default KitchenMetrics
