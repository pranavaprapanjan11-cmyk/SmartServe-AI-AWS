// File: frontend/src/pages/ai-operations/AIOperationsDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  fetchOperationsAnalytics,
  fetchOperationsEvents,
  AiOperationsDashboardData,
  ActivityEvent,
} from '../../services/aiOperationsService';
import HealthScoreCard from './HealthScoreCard';
import RealTimeWall from './RealTimeWall';
import ActivityTimeline from './ActivityTimeline';
import AlertCenter from './AlertCenter';
import HeatMaps from './HeatMaps';
import ExecutiveSnapshot from './ExecutiveSnapshot';
import RecommendationPanel from './RecommendationPanel';
import { triggerLiveActivity } from '../../utils/activityTrigger';

const AIOperationsDashboard: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<AiOperationsDashboardData | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    try {
      const [analyticsData, eventsData] = await Promise.all([
        fetchOperationsAnalytics(token),
        fetchOperationsEvents(token),
      ]);
      setData(analyticsData);
      setEvents(eventsData);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load operations data:', err);
      setError('Unable to fetch live restaurant operations.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Poll the operations analytics and events every 5 seconds to sync other sessions
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);

    // Register listener for local custom live activity events
    const handleLocalActivity = () => {
      loadData(true);
    };

    window.addEventListener('liveActivityEvent', handleLocalActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('liveActivityEvent', handleLocalActivity);
    };
  }, [token]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <section className="rounded-[2rem] border border-white/5 bg-slate-950/60 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Intelligence Center</p>
            <h1 className="mt-4 text-4xl font-semibold text-white tracking-tight">Living Operations Command Center</h1>
            <p className="mt-2 max-w-2xl text-slate-400 text-xs leading-relaxed">
              Real-time telemetry, automated alert handling, table occupancy heatmaps, and AI recommendations derived from live restaurant telemetry.
            </p>
          </div>
          <div className="rounded-3xl bg-cyan-500/10 px-5 py-3 text-cyan-300 ring-1 ring-cyan-400/20 font-bold text-xs shadow-lg uppercase tracking-widest animate-pulse">
            Active telemetry
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200 text-xs">
            {error}
          </div>
        )}
      </section>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Executive Snapshot Card summary */}
          <ExecutiveSnapshot snapshot={data?.executiveSnapshot} />

          {/* Health Score & Circular Visual */}
          <HealthScoreCard monitor={data?.healthMonitor} />

          {/* Real-time wall metrics */}
          <RealTimeWall wall={data?.realTimeWall} />

          {/* Heatmaps */}
          <HeatMaps heatmaps={data?.heatmaps} />

          {/* Alerts, Feed and Recommendations */}
          <div className="grid gap-6 lg:grid-cols-[1fr_0.90fr]">
            <ActivityTimeline events={events} />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <AlertCenter alerts={data?.alerts || []} />
              <RecommendationPanel recommendations={data?.recommendations || []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIOperationsDashboard;
