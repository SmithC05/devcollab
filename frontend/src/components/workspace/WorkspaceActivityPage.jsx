import { useState, useEffect } from 'react';
import { Activity, Clock, Filter, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import { Card, CardHeader, Spinner, EmptyState } from '../ui/index';

const ActivityStatCard = ({ label, value, icon: Icon }) => (
  <div className="min-h-[116px] bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-lg p-6 flex items-center justify-between hover:border-[var(--border-focus)] transition-colors">
    <div>
      <p className="text-[12px] font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-[34px] font-semibold text-[var(--fg)] tabular-nums leading-none">
        {value}
      </p>
    </div>
    {Icon && (
      <div className="w-12 h-12 rounded-full bg-[var(--surface-item)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
        <Icon className="text-[var(--text-secondary)]" size={22} strokeWidth={2} />
      </div>
    )}
  </div>
);

export default function WorkspaceActivityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch('/api/workspace/activity/');
        if (!response.ok) throw new Error('Failed to load activity');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  return (
    <PageContainer className="w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10 pt-12 md:pt-14">
      <div className="flex items-start justify-between flex-wrap gap-6 mb-8">
        <div>
          <h1 className="text-[40px] md:text-[44px] font-semibold text-[var(--text-primary)] mb-3 leading-tight">
            Activity
          </h1>
          <p className="text-[16px] text-[var(--text-secondary)] max-w-3xl">
            Real-time activity and historical audit across your workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center gap-2 bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-lg px-3 h-[36px]">
            <Filter size={13} className="text-[var(--text-muted)]" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-transparent text-[13px] font-medium text-[var(--text-primary)] focus:outline-none appearance-none pr-2 cursor-pointer"
            >
              <option value="All">All Activity</option>
              <option value="Projects">Projects</option>
              <option value="Tasks">Tasks</option>
              <option value="Members">Members</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size={22} /></div>
      ) : error ? (
        <div className="text-center py-20"><p className="text-red-400 text-sm">{error}</p></div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <ActivityStatCard label="Total Events" value={data?.total_events || 0} icon={Activity} />
            <ActivityStatCard label="Today" value={data?.today_events || 0} icon={Clock} />
            <ActivityStatCard label="Active Projects" value={data?.active_projects || 0} icon={Zap} />
            <ActivityStatCard label="Recent Activity" value={data?.recent_activity?.length || 0} icon={Activity} />
          </div>

          {/* 14-Day Heatmap */}
          <Card className="min-h-[190px] rounded-lg">
            <CardHeader className="px-6 pt-6 pb-4">
              <h3 className="text-[18px] font-semibold text-[var(--fg)] flex items-center gap-2">
                <Activity size={17} className="text-blue-400" />
                14-Day Activity Heatmap
              </h3>
            </CardHeader>
            <div className="px-6 pb-6">
              {(!data?.heatmap || data.heatmap.length === 0) ? (
                <EmptyState description="No activity recorded yet." />
              ) : (
                <div className="flex items-center gap-1">
                  {/* Real heatmap data would render here */}
                </div>
              )}
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="min-h-[280px] rounded-lg">
            <CardHeader className="px-6 pt-6 pb-4">
              <h3 className="text-[18px] font-semibold text-[var(--fg)]">Recent Activity Feed</h3>
            </CardHeader>
            <div className="px-6 pb-6">
              {(!data?.recent_activity || data.recent_activity.length === 0) ? (
                <EmptyState 
                  icon={Clock} 
                  description="No recent activity found in this workspace." 
                />
              ) : (
                <div className="relative border-l border-[var(--border-strong)] ml-4 space-y-5 pb-2">
                  {data.recent_activity.map((event, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="relative pl-6"
                    >
                      <div className="absolute -left-[13px] top-1 w-[22px] h-[22px] bg-[var(--surface-item)] rounded-full border-2 border-[var(--surface-card)] flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                      <div className="bg-[var(--surface-item)] border border-[var(--border-subtle)] p-3.5 rounded-lg">
                        <p className="text-[13px] text-[var(--fg)] mb-0.5">{event.action_text}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{event.timestamp}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
