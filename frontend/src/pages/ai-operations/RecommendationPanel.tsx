// File: frontend/src/pages/ai-operations/RecommendationPanel.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { OperationalRecommendation } from '../../services/aiOperationsService';

interface RecommendationPanelProps {
  recommendations: OperationalRecommendation[];
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ recommendations }) => {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-rose-500/25 bg-rose-500/5 text-rose-300 ring-1 ring-rose-500/20';
      case 'MEDIUM':
        return 'border-amber-500/25 bg-amber-500/5 text-amber-300 ring-1 ring-amber-500/20';
      default:
        return 'border-cyan-500/25 bg-cyan-500/5 text-cyan-300 ring-1 ring-cyan-500/20';
    }
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-xl h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">AI Operational Recommendations</h3>
        <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-3xs font-semibold text-cyan-200">
          Decision engine
        </span>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto pr-1 max-h-[380px] custom-scrollbar space-y-4">
        {recommendations.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-slate-500">
            No recommendations generated.
          </div>
        ) : (
          recommendations.map((rec, idx) => (
            <motion.div
              key={rec.id || idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`rounded-2xl border p-5 shadow-lg ${getPriorityStyle(rec.priority)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-extrabold tracking-wide text-white">{rec.recommendation}</p>
                <span className="text-[9px] uppercase tracking-widest font-extrabold">
                  {rec.priority}
                </span>
              </div>
              <p className="mt-2 text-3xs text-slate-300 leading-relaxed">
                {rec.reason}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendationPanel;
