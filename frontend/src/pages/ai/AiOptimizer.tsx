import React from 'react'
import { motion } from 'framer-motion'

const recommendations = [
  { id: '1', title: 'Boost high-margin biryanis', description: 'Promote Chicken Biryani with a combo offer during dinner hours.' },
  { id: '2', title: 'Upgrade low demand appetizers', description: 'Add a limited-time spicy dip to entice more orders.' },
  { id: '3', title: 'Optimize kitchen flow', description: 'Group similar preparation orders to lower service time by 12%.', badge: 'Efficiency' },
]

const AiOptimizer: React.FC = () => {
  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-amber-500/5 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70">AI Menu Optimizer</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Recommendation Studio</h1>
          </div>
          <span className="rounded-full bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 ring-1 ring-cyan-400/20">
            mock insights
          </span>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Optimization summary</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Target menu growth</h2>
            <p className="mt-4 text-slate-300">Use AI-driven recommendations to improve menu mix, reduce kitchen load, and increase average order value.</p>
            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl bg-white/5 p-5">
                <p className="text-sm text-slate-400">Predicted uplift</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-300">+18%</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-5">
                <p className="text-sm text-slate-400">Suggested margin shift</p>
                <p className="mt-2 text-3xl font-semibold text-amber-300">+9%</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="rounded-3xl border border-white/10 bg-slate-950/90 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{rec.title}</p>
                      <p className="mt-2 text-sm text-slate-400">{rec.description}</p>
                    </div>
                    {rec.badge && (
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">{rec.badge}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

export default AiOptimizer
