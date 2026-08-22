import { Outlet, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProjectSidebar from './ProjectSidebar';
import AgentPanel from '../ai/AgentPanel';

export default function ProjectLayout() {
  const { projectId } = useParams();
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsAgentOpen(true);
    document.addEventListener('open_agent_panel', handleOpen);
    
    // Also we could optionally listen for engine_event -> DECISION_TRIGGER
    // and open it, or show a notification. For this prototype, opening is nice!
    const handleEngineEvent = (e) => {
      const payload = e.detail;
      if (payload?.event_type === 'DECISION_TRIGGER') {
        setIsAgentOpen(true);
      }
    };
    document.addEventListener('engine_event', handleEngineEvent);
    
    return () => {
      document.removeEventListener('open_agent_panel', handleOpen);
      document.removeEventListener('engine_event', handleEngineEvent);
    };
  }, []);

  return (
    <div
      style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}
      className="bg-[#0d0d0f] text-[var(--text-primary)] font-sans relative"
    >
      <ProjectSidebar />

      {/* Main Content Area */}
      <main
        style={{ flex: 1, minWidth: 0, height: '100vh', overflow: 'auto' }}
        className="bg-[#0d0d0f]"
      >
        {/* We can pass setIsAgentOpen to the outlet context if we want, or just let Header handle it globally or via a store. 
            For simplicity, we'll listen to a custom event to open it. */}
        <Outlet context={{ openAgent: () => setIsAgentOpen(true) }} />
      </main>

      <AgentPanel 
        projectId={projectId || 1} 
        isOpen={isAgentOpen} 
        onClose={() => setIsAgentOpen(false)} 
      />
    </div>
  );
}
