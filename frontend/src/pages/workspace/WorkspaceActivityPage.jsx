import { useState, useEffect } from 'react';
import { Activity, Clock, Filter, Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import PageContainer from '../../components/layout/PageContainer';

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
    <PageContainer>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100 mb-1">Activity Command Center</h1>
          <p className="text-[13px] text-[#888888]">Real-time activity and historical audit feed across your workspace.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#161616] border border-[#2A2A2A] rounded-md p-1 h-[36px]">
          <Filter size={14} className="text-[#555] ml-2" />
          <select 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-transparent text-[12px] text-gray-100 focus:outline-none px-2 pr-4 appearance-none"
          >
            <option value="All">All Activity</option>
            <option value="Projects">Projects</option>
            <option value="Tasks">Tasks</option>
            <option value="Members">Members</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#666]">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Events', value: data?.total_events || 0, icon: Activity },
              { label: 'Today', value: data?.today_events || 0, icon: Clock },
              { label: 'Active Projects', value: data?.active_projects || 0, icon: Zap },
              { label: 'Recent Activity', value: data?.recent_activity?.length || 0, icon: Activity }
            ].map((stat, i) => (
              <div key={i} className="bg-[#161616] border border-[#2A2A2A] rounded-lg p-5 flex items-center justify-between">
                <div>
                  <p className="text-[#777] text-[12px] font-medium mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-100">{stat.value}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center">
                  <stat.icon className="text-[#666]" size={18} />
                </div>
              </div>
            ))}
          </div>

          {/* 14-Day Heatmap (Visual concept) */}
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-lg p-5">
            <h3 className="text-[13px] font-medium text-gray-200 mb-4 flex items-center gap-2">
              <Activity size={14} className="text-blue-500" />
              14-Day Activity Heatmap
            </h3>
            {(!data?.heatmap || data.heatmap.length === 0) ? (
              <div className="h-24 flex items-center justify-center text-[12px] text-[#555] border border-dashed border-[#2A2A2A] rounded">
                No activity recorded yet.
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {/* Real heatmap would render data here */}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-lg">
            <div className="p-4 border-b border-[#2A2A2A]">
              <h3 className="text-[13px] font-medium text-gray-200">Recent Activity Feed</h3>
            </div>
            <div className="p-5">
              {(!data?.recent_activity || data.recent_activity.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#666]">
                  <Clock size={24} className="mb-3 opacity-50" />
                  <p className="text-[13px]">No recent activity found in this workspace.</p>
                </div>
              ) : (
                <div className="relative border-l border-[#2A2A2A] ml-4 space-y-6 pb-4">
                  {data.recent_activity.map((event, i) => (
                    <div key={i} className="relative pl-6">
                      <div className="absolute -left-3 top-0 w-6 h-6 bg-[#222] rounded-full border-2 border-[#161616] flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 rounded-md inline-block min-w-[300px]">
                        <p className="text-[13px] text-gray-200 mb-1">{event.action_text}</p>
                        <p className="text-[11px] text-[#666]">{event.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
