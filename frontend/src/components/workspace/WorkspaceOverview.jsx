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
        const response = await fetch('/api/workspace/overview/');
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
        <span className="text-[13px] text-[#555]">Loading workspace...</span>
      </div>
    );
  }

  return (
    <PageContainer>
      {/* ── 1. HEADER ──────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
        <div style={{ minWidth: 0 }}>
          <div className="text-[10px] font-semibold text-[#555] uppercase tracking-[0.14em] mb-2">
            {data?.workspace_name || 'WORKSPACE'}
          </div>
          <h1 className="text-[32px] font-semibold leading-tight text-gray-100 tracking-tight mb-1">
            {getGreeting()}, {data?.user_name || 'User'}
          </h1>
          <p className="text-[13px] text-[#666]">
            {data?.total_projects === 1 ? '1 project' : `${data?.total_projects ?? 0} projects`}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 mt-2">
          <button className="flex items-center gap-2 h-[36px] px-4 border border-[#2A2A2A] bg-[#161616] hover:bg-[#1E1E1E] text-gray-100 rounded-md text-[13px] font-medium transition-colors">
            <Sparkles size={14} />
            Ask AI
          </button>
          <button className="flex items-center gap-2 h-[38px] px-5 bg-white text-black hover:bg-gray-100 rounded-md text-[13px] font-semibold transition-colors">
            <Plus size={15} />
            New Project
          </button>
        </div>
      </div>

      {/* ── 2. PERSONAL STATS ──────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div>
          <div className="text-[32px] font-semibold text-gray-100 leading-none mb-2 tabular-nums">
            {data?.tasks_pending ?? 0}
          </div>
          <div className="text-[12px] font-medium text-[#666]">Tasks Pending</div>
        </div>
        <div>
          <div className="text-[32px] font-semibold text-gray-100 leading-none mb-2 tabular-nums">
            {data?.tasks_completed ?? 0}
          </div>
          <div className="text-[12px] font-medium text-[#666]">Tasks Completed</div>
        </div>
        <div>
          <div className="text-[32px] font-semibold text-gray-100 leading-none mb-2 tabular-nums">
            {data?.active_projects_user ?? 0}
          </div>
          <div className="text-[12px] font-medium text-[#666]">Active Projects</div>
        </div>
      </div>

      {/* ── 3. TOP PRIORITY TASKS & MY PROJECTS ────────────── */}
      <div className="grid grid-cols-2 gap-6 mb-6 items-stretch">
        {/* Top Priority Tasks */}
        <div className="bg-[#151515] border border-[#222] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-gray-100">Top Priority Tasks</h2>
            <button className="text-[12px] text-[#777] hover:text-gray-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {data?.top_priority_tasks?.length > 0 ? (
              data.top_priority_tasks.map((task, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#444] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${task.status === 'Done' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                    <div>
                      <div className="text-[13px] font-medium text-gray-200 group-hover:text-blue-400 transition-colors">{task.title}</div>
                      <div className="text-[11px] text-[#666] mt-0.5">{task.status}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border border-[#333] text-[#888] bg-[#111]">
                    {task.priority}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-[#111] rounded-lg border border-dashed border-[#222]">
                <div className="text-[13px] font-medium text-[#AAA] mb-1">No priority tasks</div>
                <div className="text-[12px] text-[#666]">You're all caught up.</div>
              </div>
            )}
          </div>
        </div>

        {/* My Projects */}
        <div className="bg-[#151515] border border-[#222] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-gray-100">My Projects</h2>
            <button className="text-[12px] text-[#777] hover:text-gray-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {data?.my_projects?.length > 0 ? (
              data.my_projects.map((project, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#444] transition-colors cursor-pointer group">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[13px] font-medium text-gray-200 group-hover:text-blue-400 transition-colors truncate">{project.name}</div>
                      <div className={`w-1.5 h-1.5 rounded-full ${project.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-[#666] mb-2.5">
                      <span className="flex items-center gap-1.5"><Circle size={10} /> {project.tasks_open} open tasks</span>
                      <span className="flex items-center gap-1.5"><Check size={11} /> {project.tasks_completed} completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                      </div>
                      <span className="text-[10px] text-[#777] font-medium w-6 text-right">{project.progress}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-[#111] rounded-lg border border-dashed border-[#222]">
                <div className="text-[13px] font-medium text-[#AAA] mb-1">No projects yet</div>
                <div className="text-[12px] text-[#666]">Create your first project.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. NOTIFICATIONS, RECENT PROJECTS, RECENT ACTIVITY ─ */}
      <div className="grid grid-cols-3 gap-6 mb-12 items-stretch">
        {/* Notifications */}
        <div className="bg-[#151515] border border-[#222] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-gray-100">Notifications</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className="w-8 h-8 rounded-full border border-[#2A2A2A] flex items-center justify-center mb-3 text-green-500 bg-[#111]">
              <CheckCircle2 size={16} />
            </div>
            <div className="text-[12px] font-medium text-[#AAA] mb-1">No notifications</div>
            <div className="text-[11px] text-[#666]">You're all caught up.</div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-[#151515] border border-[#222] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-gray-100">Recent Projects</h2>
            <button className="text-[11px] text-[#777] hover:text-gray-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={10} />
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            {data?.recent_projects?.length > 0 ? (
              data.recent_projects.map((p, i) => (
                <div key={i} className="flex flex-col justify-center p-3 rounded-lg border border-[#222] bg-[#111] hover:border-[#333] cursor-pointer transition-colors">
                  <div className="text-[12px] font-medium text-gray-300 mb-1 truncate">{p.name}</div>
                  <div className="text-[10px] text-[#666]">{p.tasks_count} tasks</div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                <div className="text-[12px] font-medium text-[#AAA]">No recent projects</div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#151515] border border-[#222] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-gray-100">Recent Activity</h2>
            <button className="text-[11px] text-[#777] hover:text-gray-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={10} />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className="text-[12px] font-medium text-[#AAA] mb-1">No recent activity</div>
          </div>
        </div>
      </div>

      {/* ── 5. WORKSPACE ACTIVITY (CHARTS) ─────────────────── */}
      <div className="mb-4">
        <span className="text-[10px] font-semibold text-[#555] uppercase tracking-[0.14em]">
          WORKSPACE ACTIVITY
        </span>
      </div>
      <div className="grid grid-cols-2 gap-6 w-full">
        {/* Tasks Completed Chart */}
        <div className="rounded-xl border border-[#222] bg-[#151515] flex flex-col overflow-hidden h-[240px]">
          <div className="px-5 pt-5 pb-2 text-[11px] text-[#555] font-medium shrink-0">
            Tasks Completed (Last 7 Days)
          </div>
          <div className="flex-1 min-h-0 px-2 pb-2">
            <TasksCompletedChart data={data?.tasks_completed_7_days} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-xl border border-[#222] bg-[#151515] flex flex-col overflow-hidden h-[240px]">
          <div className="px-5 pt-5 pb-2 text-[11px] text-[#555] font-medium shrink-0">
            Status Distribution
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center px-5 pb-5">
            <StatusDistribution distribution={data?.task_status_distribution} />
          </div>
        </div>
      </div>

    </PageContainer>
  );
}
