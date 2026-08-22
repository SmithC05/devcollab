import { useState, useEffect } from 'react';
import { Sparkles, Plus, Bell as BellIcon, CheckCircle2 } from 'lucide-react';
import TasksCompletedChart from "../dashboard/TasksCompletedChart";
import StatusDistribution from "../dashboard/StatusDistribution";

export default function WorkspaceOverview({ setWorkspaceName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/workspace/overview/');
        if (response.ok) {
          const json = await response.json();
          setData(json);
          setWorkspaceName(json.workspace_name);
        } else {
          console.error('Failed to fetch workspace data');
        }
      } catch (err) {
        console.error('Error fetching workspace data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setWorkspaceName]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-[12px] text-[#555555]">Loading workspace...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto pt-[28px] pb-24 px-[32px] box-border">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-[40px] flex-wrap gap-4">
        <div style={{ minWidth: 0 }}>
          {/* Workspace label */}
          <div className="text-[9px] font-semibold text-[#555555] uppercase tracking-[0.14em] mb-[8px]">
            {data?.workspace_name || 'TEAM THUNDER'}
          </div>
          {/* Greeting */}
          <h1 className="text-[clamp(28px,2.2vw,34px)] font-semibold leading-[1.15] text-gray-100 tracking-tight mb-[6px]">
            {getGreeting()}, {data?.user_name || 'dev collab'}
          </h1>
          {/* Project count */}
          <p className="text-[12px] text-[#666666]">
            {data?.active_projects === 1 ? '1 project' : `${data?.active_projects ?? 0} projects`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-[8px] shrink-0">
          <button className="flex items-center justify-center gap-[6px] h-[36px] px-4 shrink-0
                             border border-[#2A2A2A] bg-[#161616]
                             hover:bg-[#1E1E1E] text-gray-100
                             rounded-[7px] text-[13px] font-medium transition-colors whitespace-nowrap">
            <Sparkles size={14} />
            Ask AI
          </button>
          <button className="flex items-center justify-center gap-[6px] h-[38px] px-5 shrink-0
                             bg-white text-gray-900
                             hover:opacity-90 rounded-[7px] text-[13px] font-semibold transition-opacity whitespace-nowrap">
            <Plus size={15} />
            New Project
          </button>
        </div>
      </div>

      {/* ── STATS ──────────────────────────────────────────── */}
      <div
        className="grid mb-10"
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="text-[26px] font-semibold text-gray-100 leading-none mb-1.5 tabular-nums">
            {data?.active_projects ?? 0}
          </div>
          <div className="text-[11px] text-[#666666] truncate">Active Projects</div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="text-[26px] font-semibold text-gray-100 leading-none mb-1.5 tabular-nums">
            {data?.team_members ?? 1}
          </div>
          <div className="text-[11px] text-[#666666] truncate">Team Members</div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="text-[26px] font-semibold text-gray-100 leading-none mb-1.5 tabular-nums">
            {data?.total_tasks ?? 0}
          </div>
          <div className="text-[11px] text-[#666666] truncate">Tasks Across Projects</div>
        </div>
      </div>

      {/* ── DIVIDER ─────────────────────────────────────────── */}
      <div className="h-px bg-[#1F1F1F] mb-8 w-full" />

      {/* ── SECTION HEADERS ─────────────────────────────────── */}
      <div
        className="grid gap-[14px] mb-4 w-full"
        style={{ gridTemplateColumns: '1fr 1fr 1.35fr' }}
      >
        <div className="col-span-2">
          <span className="text-[9px] font-semibold text-[#555555] uppercase tracking-[0.14em]">
            WORKSPACE ACTIVITY
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <BellIcon size={12} className="text-[#555555]" />
          <span className="text-[11px] font-medium text-[#CCCCCC]">
            Notifications
          </span>
        </div>
      </div>

      {/* ── ACTIVITY CARDS ──────────────────────────────────── */}
      <div
        className="grid gap-[14px] w-full"
        style={{ gridTemplateColumns: '1fr 1fr 1.35fr' }}
      >
        {/* Card 1: Tasks Completed Chart */}
        <div
          className="rounded-xl border border-[#222222] bg-[#151515] flex flex-col overflow-hidden"
          style={{ height: '190px' }}
        >
          <div className="px-5 pt-5 pb-2 text-[9px] text-[#555555] shrink-0">
            Tasks Completed (Last 7 Days)
          </div>
          <div className="flex-1 min-h-0 px-2 pb-2">
            <TasksCompletedChart data={data?.tasks_completed_7_days} />
          </div>
        </div>

        {/* Card 2: Status Distribution */}
        <div
          className="rounded-xl border border-[#222222] bg-[#151515] flex flex-col overflow-hidden"
          style={{ height: '190px' }}
        >
          <div className="px-5 pt-5 pb-2 text-[9px] text-[#555555] shrink-0">
            Status Distribution
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center px-5">
            <StatusDistribution distribution={data?.task_status_distribution} />
          </div>
        </div>

        {/* Card 3: Notifications */}
        <div
          className="rounded-xl border border-[#222222] bg-[#151515] flex flex-col items-center justify-center overflow-hidden"
          style={{ height: '190px' }}
        >
          <div className="w-7 h-7 rounded-full border border-[#2A2A2A]
                          flex items-center justify-center mb-3 text-green-500">
            <CheckCircle2 size={15} />
          </div>
          <div className="text-[11px] font-medium text-[#AAAAAA]">
            No notifications
          </div>
        </div>

      </div>
    </div>
  );
}
