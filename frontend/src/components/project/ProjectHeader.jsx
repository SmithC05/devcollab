import { Search, Bell, Settings } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';

export default function ProjectHeader() {
  const { projectId } = useParams();
  const projectName = projectId || "P1";
  
  const { unreadCount, fetchNotifications, isLoaded, addNotification } = useNotificationStore();
  
  useEffect(() => {
    if (!isLoaded) {
      fetchNotifications();
    }
    
    // Listen for incoming notifications from WS (if we implemented a notification_event)
    // For now we can also listen to engine_event as a stand-in if we want, but typically 
    // notifications would be sent to a user-specific group. We'll leave the hook ready.
    const handleNotification = (e) => {
      addNotification(e.detail);
    };
    document.addEventListener('notification_event', handleNotification);
    return () => document.removeEventListener('notification_event', handleNotification);
  }, [isLoaded, fetchNotifications, addNotification]);

  return (
    <header className="h-16 border-b border-[#222] bg-[#161616] flex items-center justify-between px-6">
      {/* Breadcrumb / Left Side */}
      <div className="flex items-center text-sm">
        <span className="text-zinc-400">Collab</span>
        <span className="mx-3 text-zinc-600">/</span>
        <span className="text-zinc-200 font-medium">{projectName}</span>
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
        <button className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[#333] hover:bg-[#222] transition-colors text-zinc-400 text-xs">
          <Search className="w-3.5 h-3.5" />
          <span className="font-medium tracking-widest text-[10px]">⌘K</span>
        </button>

        {/* Action Icons */}
        <button className="text-zinc-400 hover:text-zinc-200 transition-colors relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#161616] text-[8px] text-white flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
