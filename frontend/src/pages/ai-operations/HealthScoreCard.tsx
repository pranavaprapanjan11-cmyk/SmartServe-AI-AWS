// File: frontend/src/pages/ai-operations/HealthScoreCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { HealthMonitor } from '../../services/aiOperationsService';

interface HealthScoreCardProps {
  monitor?: HealthMonitor;
}

const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ monitor }) => {
  if (!monitor) return null;

  const score = monitor.overallScore;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getSeverityColor = (label: string) => {
    switch (label) {
      case 'Excellent':
        return 'text-emerald-400 stroke-emerald-400 shadow-emerald-500/20';
      case 'Good':
        return 'text-cyan-400 stroke-cyan-400 shadow-cyan-500/20';
      case 'Needs Attention':
        return 'text-amber-400 stroke-amber-400 shadow-amber-500/20';
      default:
        return 'text-rose-500 stroke-rose-500 shadow-rose-500/20';
    }
  };

  const getSubcategoryProgressColor = (label: string) => {
    switch (label) {
      case 'Excellent':
        return 'bg-emerald-400';
      case 'Good':
        return 'bg-cyan-400';
      case 'Needs Attention':
        return 'bg-amber-400';
      default:
        return 'bg-rose-500';
    }
  };

  const subcategories = [
    { name: 'Revenue Health', score: monitor.revenueHealth.score, label: monitor.revenueHealth.label },
    { name: 'Kitchen Health', score: monitor.kitchenHealth.score, label: monitor.kitchenHealth.label },
    { name: 'Billing Health', score: monitor.billingHealth.score, label: monitor.billingHealth.label },
    { name: 'Inventory Health', score: monitor.inventoryHealth.score, label: monitor.inventoryHealth.label },
    { name: 'Table Utilization', score: monitor.tableUtilization.score, label: monitor.tableUtilization.label },
    { name: 'Staff Performance', score: monitor.staffPerformance.score, label: monitor.staffPerformance.label },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[0.8fr_1.2fr]">
      {/* Circular Progress Gauge */}
      <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-slate-900/60 p-6 text-center backdrop-blur-xl">
        <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400">SmartServe Health Score</h3>
        <div className="relative mt-8 flex h-36 w-36 items-center justify-center">
          <svg className="h-full w-full rotate-[-90deg]">
            {/* Background Circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-slate-800 fill-none"
              strokeWidth="10"
            />
            {/* Animated Gauge Progress */}
            <motion.circle
              cx="72"
              cy="72"
              r={radius}
              className={`fill-none ${getSeverityColor(getGrade(score))}`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-extrabold text-white"
            >
              {score}
            </motion.span>
            <span className="text-4xs uppercase tracking-widest text-slate-400 mt-0.5">/ 100</span>
          </div>
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-200">
          {getGrade(score)} Operations
        </p>
      </div>

      {/* Subcategory Bars */}
      <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Operational Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {subcategories.map((sub, idx) => (
            <div key={idx} className="space-y-1.5 rounded-2xl border border-white/5 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-slate-400">{sub.name}</span>
                <span className="font-bold text-white">{sub.score}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-850">
                <motion.div
                  className={`h-full rounded-full ${getSubcategoryProgressColor(sub.label)}`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${sub.score}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                />
              </div>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                {sub.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function getGrade(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs Attention';
  return 'Critical';
}

export default HealthScoreCard;
