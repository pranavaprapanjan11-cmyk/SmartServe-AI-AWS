import React from 'react'
import * as orderService from '../../services/orderService'

type Props = {
  order: orderService.Order
  onAction: (order: orderService.Order) => void
}

const KitchenTicket: React.FC<Props> = ({ order, onAction }) => {
  const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)

  const getAlert = () => {
    if (elapsed > 25) return 'border-red-400 bg-red-700/10'
    if (elapsed > 15) return 'border-amber-400 bg-amber-700/10'
    return 'border-white/10 bg-[#0c101c]/80'
  }

  const actionLabel = () => {
    switch (order.status) {
      case orderService.OrderStatus.NEW:
        return 'Start Cooking'
      case orderService.OrderStatus.PREPARING:
        return 'Mark Ready'
      case orderService.OrderStatus.READY:
        return 'Mark Served'
      default:
        return null
    }
  }

  return (
    <div className={`rounded-2xl border p-4 ${getAlert()} transition`}> 
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Table</p>
          <h3 className="text-2xl font-bold text-white">{order.table_number}</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Guests</p>
          <p className="text-lg font-semibold text-white">{order.guest_count}</p>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-300">
        {order.items && order.items.slice(0,5).map(item => (
          <div key={item.id} className="flex justify-between py-1">
            <span>{item.name || item.menu_item_id} x{item.quantity}</span>
            <span>₹{item.subtotal.toFixed(2)}</span>
          </div>
        ))}
        {order.items && order.items.length > 5 && <div className="text-xs text-slate-500">+{order.items.length - 5} more</div>}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          <div>Order: {new Date(order.created_at).toLocaleTimeString()}</div>
          <div>Elapsed: {elapsed}m</div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Total</p>
          <p className="text-lg font-bold text-white">₹{order.total_amount.toFixed(2)}</p>
        </div>
      </div>

      {actionLabel() && (
        <button
          onClick={() => onAction(order)}
          className="mt-4 w-full rounded-2xl bg-cyan-500 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition"
        >
          {actionLabel()}
        </button>
      )}
    </div>
  )
}

export default KitchenTicket
