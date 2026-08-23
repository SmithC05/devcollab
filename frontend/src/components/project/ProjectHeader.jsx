import { Search, Bell, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useEffect } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import { Sparkles } from 'lucide-react';

export default function ProjectHeader() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { project } = useOutletContext() || {};
  const projectName = project?.name || projectId || "P1";
  
  const { unreadCount, fetchNotifications, isLoaded, addNotification } = useNotificationStore();
  
  useEffect(() => {
    if (!isLoaded) {
      fetchNotifications();
    }
    const handleNotification = (e) => {
      addNotification(e.detail);
    };
    document.addEventListener('notification_event', handleNotification);
    return () => document.removeEventListener('notification_event', handleNotification);
  }, [isLoaded, fetchNotifications, addNotification]);

  return (
    <header className="h-[60px] bg-[var(--bg)] border-b border-[var(--border-subtle)] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumb / Left Side */}
      <div className="flex items-center gap-2 text-[13px]">
        <button
          id="header-back-to-workspace"
          onClick={() => navigate('/dashboard/projects')}
          className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[var(--text-muted)] hover:bg-[var(--surface-item)] hover:text-[var(--text-primary)] font-medium transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Projects
        </button>
        <span className="text-[var(--text-muted)]">/</span>
        <span className="text-[var(--text-primary)] font-semibold truncate max-w-[200px]">{projectName}</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-5">
        {/* Agent Shortcut */}
        <button 
          onClick={() => {
            // Dispatch a custom event that ProjectLayout can optionally listen to, 
            // or just use window dispatch. Let's just use window dispatch for simplicity 
            // since we didn't pass a prop down. Wait, we can pass an event!
            document.dispatchEvent(new CustomEvent('open_agent_panel'));
          }}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors text-indigo-400 text-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-medium tracking-widest text-[10px] uppercase">Agent</span>
        </button>

        {/* Search Shortcut */}
        <button className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[var(--border-strong)] hover:bg-[var(--border-default)] transition-colors text-zinc-400 text-xs">
          <Search className="w-3.5 h-3.5" />
          <span className="font-medium tracking-widest text-[10px]">⌘K</span>
        </button>

        {/* Action Icons */}
        <button className="text-zinc-400 hover:text-zinc-200 transition-colors relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[var(--surface-raised)] text-[8px] text-white flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
