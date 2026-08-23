import { useState, useEffect } from 'react';
import { Activity, Clock, Filter, Zap } from 'lucide-react';
import { apiClient } from '../../api/client';
import { motion } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import { Card, CardHeader, Spinner, SectionHeader, StatCard, EmptyState } from '../ui/index';

export default function WorkspaceActivityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await apiClient('/workspace/activity/');
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Activity"
        description="Real-time activity and historical audit across your workspace."
        action={
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
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size={22} /></div>
      ) : error ? (
        <div className="text-center py-20"><p className="text-red-400 text-sm">{error}</p></div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard label="Total Events" value={data?.total_events || 0} icon={Activity} />
            <StatCard label="Today" value={data?.today_events || 0} icon={Clock} />
            <StatCard label="Active Projects" value={data?.active_projects || 0} icon={Zap} />
            <StatCard label="Recent Activity" value={data?.recent_activity?.length || 0} icon={Activity} />
          </div>

          {/* 14-Day Heatmap */}
          <Card>
            <CardHeader>
              <h3 className="text-[14px] font-semibold text-[var(--fg)] flex items-center gap-2">
                <Activity size={14} className="text-blue-400" />
                14-Day Activity Heatmap
              </h3>
            </CardHeader>
            <div className="px-5 pb-5">
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
          <Card>
            <CardHeader>
              <h3 className="text-[14px] font-semibold text-[var(--fg)]">Recent Activity Feed</h3>
            </CardHeader>
            <div className="px-5 pb-5">
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
