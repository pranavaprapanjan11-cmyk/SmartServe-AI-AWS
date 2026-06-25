import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LiveActivity {
  id: string
  type: string
  title: string
  subtitle: string
  timestamp: Date
  data?: any
}

// Inline component for counting numbers up
const CountUp: React.FC<{ from: number; to: number; duration: number }> = ({ from, to, duration }) => {
  const [count, setCount] = useState(from)

  useEffect(() => {
    let start = 0
    const end = to
    const totalMiliseconds = duration * 1000
    const stepTime = Math.abs(Math.floor(totalMiliseconds / (end - from)))
    
    // Safety cap on interval time
    const intervalTime = Math.max(stepTime, 20)
    const stepValue = Math.max(Math.floor((end - from) / (totalMiliseconds / intervalTime)), 1)

    const timer = setInterval(() => {
      start += stepValue
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, intervalTime)

    return () => clearInterval(timer)
  }, [from, to, duration])

  return <span>₹{count.toLocaleString('en-IN')}</span>
}

const LiveActivityOverlay: React.FC = () => {
  const [activities, setActivities] = useState<LiveActivity[]>([])

  useEffect(() => {
    const handleActivity = (e: Event) => {
      const customEvent = e as CustomEvent
      const { type, data } = customEvent.detail

      let title = 'Activity Alert'
      let subtitle = 'Something happened'

      switch (type) {
        case 'orderCreated':
          title = 'Order Created'
          subtitle = `Order #${data?.orderId || '1024'} submitted to kitchen.`
          break
        case 'cookingStarted':
          title = 'Cooking Started'
          subtitle = `Chef started preparing Order #${data?.orderId || '1024'}.`
          break
        case 'orderReady':
          title = 'Order Ready'
          subtitle = `Order #${data?.orderId || '1024'} is ready for pickup at Table ${data?.tableNumber || 4}.`
          break
        case 'orderServed':
          title = 'Order Served'
          subtitle = `Order #${data?.orderId || '1024'} served to Table ${data?.tableNumber || 4}.`
          break
        case 'tableOccupied':
          title = 'Table Seated'
          subtitle = `Table ${data?.tableNumber || 5} (${data?.seats || 4} seats) is now occupied.`
          break
        case 'tableAvailable':
          title = 'Table Available'
          subtitle = `Table ${data?.tableNumber || 5} is now cleared & available.`
          break
        case 'paymentSuccess':
          title = 'Payment Received'
          subtitle = `Bill paid successfully. Amount: ₹${data?.amount || 2450}.`
          break
        case 'inventoryAlert':
          title = 'Low Stock Warning'
          subtitle = `Low stock on: ${data?.items?.join(', ') || 'Rice, Chicken, Tomato'}.`
          break
        case 'analyticsCounter':
          title = 'Revenue Counter'
          subtitle = 'Updating daily business performance.'
          break
        case 'aiInsightsReveal':
          title = 'AI Recommendations loaded'
          subtitle = 'Staggering business optimization insights.'
          break
        case 'notificationsBadge':
          title = 'Notifications Badge'
          subtitle = 'Alert level incremented. Check messages.'
          break
        default:
          break
      }

      const newActivity: LiveActivity = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        title,
        subtitle,
        timestamp: new Date(),
        data
      }

      setActivities((prev) => [newActivity, ...prev].slice(0, 3)) // Show max 3 toast notifications

      // Remove activity after 4 seconds
      setTimeout(() => {
        setActivities((prev) => prev.filter((a) => a.id !== newActivity.id))
      }, 4000)
    }

    window.addEventListener('liveActivityEvent', handleActivity)
    return () => window.removeEventListener('liveActivityEvent', handleActivity)
  }, [])

  // Render specific micro-animation SVG based on type
  const renderMicroAnimation = (activity: LiveActivity) => {
    const { type, data } = activity
    
    switch (type) {
      case 'orderCreated':
        // Waiter walks toward kitchen, ticket flies up
        return (
          <div className="relative h-16 w-full overflow-hidden rounded-xl border border-white/5 bg-slate-950/40 p-2">
            <div className="flex justify-between text-4xs text-slate-500 font-semibold px-1">
              <span>WAITER STATION</span>
              <span>KITCHEN</span>
            </div>
            <div className="relative mt-2 flex items-center justify-between px-2">
              {/* Waiter Station */}
              <div className="h-6 w-6 rounded bg-sky-500/25 border border-sky-400/30 flex items-center justify-center">
                👔
              </div>
              
              {/* Walking waiter */}
              <motion.div
                initial={{ x: -90, opacity: 1 }}
                animate={{ x: 60 }}
                transition={{ duration: 1.8, ease: 'linear' }}
                className="absolute left-1/2 -ml-3 flex flex-col items-center"
              >
                <span className="text-sm">🚶</span>
                <motion.div
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: -16, opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.5, repeat: 1, repeatType: 'reverse' }}
                  className="absolute text-xs"
                >
                  📝
                </motion.div>
              </motion.div>

              {/* Kitchen */}
              <div className="h-6 w-6 rounded bg-emerald-500/25 border border-emerald-400/30 flex items-center justify-center">
                🍳
              </div>
            </div>
          </div>
        )

      case 'cookingStarted':
        // Chef hat icon + cooking flame animation
        return (
          <div className="flex items-center justify-center h-16 w-full rounded-xl border border-white/5 bg-slate-950/40 gap-4">
            {/* Chef Hat Icon */}
            <div className="relative">
              <span className="text-2xl">👩‍🍳</span>
              {/* Subtle pulsing glow */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 -z-10 rounded-full bg-amber-500/20 blur-md"
              />
            </div>

            {/* Flickering cooking flames */}
            <div className="flex items-end gap-1 h-6">
              {[0, 1, 2].map((idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    height: [8, 20, 10, 24, 8][idx],
                    scaleY: [1, 1.3, 0.8, 1.2, 1]
                  }}
                  transition={{
                    duration: 0.6 + idx * 0.15,
                    repeat: Infinity,
                    repeatType: 'reverse'
                  }}
                  className="w-1.5 rounded-full bg-gradient-to-t from-orange-600 to-amber-400 origin-bottom"
                />
              ))}
            </div>
          </div>
        )

      case 'orderReady':
        // Bell rings + pickup alert pulse
        return (
          <div className="flex items-center justify-center h-16 w-full rounded-xl border border-white/5 bg-slate-950/40 gap-6">
            {/* Golden bell swinging */}
            <motion.div
              animate={{ rotate: [-20, 20, -15, 15, -10, 10, 0] }}
              transition={{ duration: 1.6, ease: 'easeOut' }}
              className="text-3xl origin-top"
            >
              🔔
            </motion.div>

            {/* Pulsing visual: Ready For Pickup */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="rounded-full bg-emerald-500/15 border border-emerald-400/30 px-4 py-1.5 text-2xs font-bold text-emerald-300 uppercase tracking-widest"
            >
              Ready For Pickup
            </motion.div>
          </div>
        )

      case 'orderServed':
        // Food tray travels from kitchen to table
        return (
          <div className="relative h-16 w-full overflow-hidden rounded-xl border border-white/5 bg-slate-950/40 p-2">
            <div className="flex justify-between text-4xs text-slate-500 font-semibold px-1">
              <span>KITCHEN</span>
              <span>TABLE {data?.tableNumber || 4}</span>
            </div>
            <div className="relative mt-2 flex items-center justify-between px-2">
              <div className="h-6 w-6 rounded bg-emerald-500/25 border border-emerald-400/30 flex items-center justify-center text-xs">
                🍳
              </div>

              {/* Dotted path */}
              <div className="absolute inset-x-8 top-3 h-0.5 border-t border-dashed border-slate-700" />
              
              {/* Traveling Tray */}
              <motion.div
                initial={{ x: -95 }}
                animate={{ x: 65 }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
                className="absolute left-1/2 -ml-3 text-sm z-10"
              >
                🍽️
              </motion.div>

              <div className="h-6 w-6 rounded bg-purple-500/25 border border-purple-400/30 flex items-center justify-center text-xs">
                🪑
              </div>
            </div>
          </div>
        )

      case 'tableOccupied':
        // Customer seated, table Green -> Red
        return (
          <div className="flex items-center justify-between h-16 w-full rounded-xl border border-white/5 bg-slate-950/40 px-4">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xs font-semibold text-emerald-400">
                T{data?.tableNumber || 5}
              </div>
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              {/* Animate table color boundary */}
              <motion.div
                initial={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', borderColor: 'rgba(52, 211, 153, 0.3)' }}
                animate={{ backgroundColor: 'rgba(244, 63, 94, 0.25)', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                transition={{ duration: 0.8 }}
                className="h-7 w-7 rounded-lg border flex items-center justify-center text-xs font-semibold text-red-300"
              >
                T{data?.tableNumber || 5}
              </motion.div>
            </div>

            {/* Avatar fade-in */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex items-center gap-1.5"
            >
              <div className="h-6 w-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-3xs font-bold">
                👨
              </div>
              <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider">Seated</span>
            </motion.div>
          </div>
        )

      case 'tableAvailable':
        // Customer leaves, table Red -> Green
        return (
          <div className="flex items-center justify-between h-16 w-full rounded-xl border border-white/5 bg-slate-950/40 px-4">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-red-500/20 border border-red-400/30 flex items-center justify-center text-xs font-semibold text-red-400">
                T{data?.tableNumber || 5}
              </div>
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <motion.div
                initial={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                animate={{ backgroundColor: 'rgba(52, 211, 153, 0.25)', borderColor: 'rgba(52, 211, 153, 0.4)' }}
                transition={{ duration: 0.8 }}
                className="h-7 w-7 rounded-lg border flex items-center justify-center text-xs font-semibold text-emerald-300"
              >
                T{data?.tableNumber || 5}
              </motion.div>
            </div>

            {/* Avatar fade-out */}
            <motion.div
              animate={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-1.5"
            >
              <div className="h-6 w-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-3xs font-bold">
                👨
              </div>
              <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider">Cleared</span>
            </motion.div>
          </div>
        )

      case 'paymentSuccess':
        // Receipt printed upward + green success glow
        return (
          <div className="relative flex items-center justify-between h-16 w-full rounded-xl border border-white/5 bg-slate-950/40 px-4 overflow-hidden">
            {/* Green success wave pulse */}
            <motion.div
              initial={{ scale: 0, opacity: 0.4 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute h-10 w-10 rounded-full bg-emerald-500/20 -left-2"
            />

            <div className="flex items-center gap-3">
              {/* Cash Register Icon */}
              <span className="text-2xl">💸</span>
              {/* Receipt slides up */}
              <div className="relative w-10 h-10 overflow-hidden border-r border-white/5">
                <motion.div
                  initial={{ y: 24 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="absolute bottom-0 left-0 w-8 bg-white border border-slate-300 shadow p-1 flex flex-col gap-0.5"
                >
                  <div className="w-full h-0.5 bg-slate-800" />
                  <div className="w-5 h-0.5 bg-slate-500" />
                  <div className="w-6 h-0.5 bg-slate-500" />
                  <div className="w-4 h-0.5 bg-slate-500" />
                </motion.div>
              </div>
            </div>

            {/* Revenue card update counter */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/25 px-2.5 py-1 text-right">
              <span className="text-4xs text-slate-400 font-bold uppercase tracking-wider block">Daily Revenue</span>
              <span className="text-xs font-bold text-emerald-300">
                <CountUp from={50390} to={50390 + (data?.amount || 2450)} duration={1.5} />
              </span>
            </div>
          </div>
        )

      case 'inventoryAlert':
        // Low Stock shake
        return (
          <div className="flex items-center justify-around h-16 w-full rounded-xl border border-white/5 bg-slate-950/40 px-2">
            {(data?.items || ['Rice', 'Chicken', 'Tomato']).map((ing: string, idx: number) => (
              <motion.div
                key={ing}
                animate={{
                  x: [-2, 2, -2, 2, 0],
                  rotate: [-1, 1, -1, 1, 0]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1.5 + idx * 0.3
                }}
                className="flex items-center gap-1 bg-amber-500/10 border border-amber-400/20 rounded-lg px-2 py-1 shadow shadow-amber-500/5"
              >
                <span className="text-3xs text-amber-300 font-bold">{ing}</span>
                <span className="text-3xs">⚠️</span>
              </motion.div>
            ))}
          </div>
        )

      case 'analyticsCounter':
        // Revenue card updates (₹0 -> ₹52,840)
        return (
          <div className="flex items-center justify-between h-16 w-full rounded-xl border border-white/5 bg-slate-950/40 px-4">
            <div className="flex flex-col">
              <span className="text-4xs text-slate-500 font-bold uppercase tracking-widest">TODAY SALES</span>
              <span className="text-base font-extrabold text-white">
                <CountUp from={0} to={52840} duration={1.6} />
              </span>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-7 w-7 rounded-full bg-cyan-500/10 border border-cyan-400/25 flex items-center justify-center text-cyan-300"
            >
              📈
            </motion.div>
          </div>
        )

      case 'aiInsightsReveal':
        // AI Recommendations cards fade and slide in one-by-one
        return (
          <div className="flex flex-col gap-1 justify-center h-16 w-full rounded-xl border border-white/5 bg-slate-950/40 px-3">
            <div className="flex items-center justify-between">
              <span className="text-4xs text-cyan-300 font-bold uppercase tracking-widest">AI SUGGESTIONS</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-cyan-400 shadow shadow-cyan-400"
              />
            </div>
            <div className="flex gap-1.5 mt-1 overflow-hidden">
              {[1, 2, 3].map((cardNum) => (
                <motion.div
                  key={cardNum}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: cardNum * 0.25, duration: 0.4 }}
                  className="flex-1 rounded-md bg-white/5 border border-white/5 p-1 text-4xs text-slate-400 font-medium truncate"
                >
                  Card #{cardNum} loaded
                </motion.div>
              ))}
            </div>
          </div>
        )

      case 'notificationsBadge':
        // Notification bell shake
        return (
          <div className="flex items-center justify-center h-16 w-full rounded-xl border border-white/5 bg-slate-950/40 gap-3">
            <motion.div
              animate={{ rotate: [-15, 15, -15, 15, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="text-2xl"
            >
              🔔
            </motion.div>
            <div className="flex flex-col">
              <span className="text-3xs font-bold text-white uppercase tracking-wider">Badge Incremented</span>
              <span className="text-4xs text-slate-400">Header alert counter updated (+1)</span>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 w-80 max-w-full">
      <AnimatePresence mode="popLayout">
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            layout
            className="flex flex-col rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl"
          >
            {/* Header info */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">{activity.title}</h4>
                <p className="text-3xs text-slate-400 mt-0.5 leading-snug">{activity.subtitle}</p>
              </div>
              <span className="text-5xs text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
                LIVE
              </span>
            </div>

            {/* Animation Canvas */}
            <div className="mt-1">
              {renderMicroAnimation(activity)}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default LiveActivityOverlay
