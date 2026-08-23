import { Outlet, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProjectSidebar from './ProjectSidebar';
import ProjectHeader from './ProjectHeader';
import AgentPanel from '../ai/AgentPanel';

export default function ProjectLayout() {
  const { projectId } = useParams();
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        const projects = await apiClient('/workspace/projects/');
        const found = projects.find(p => p.id.toString() === projectId || p.name === projectId);
        if (found) {
          setCurrentProject(found);
        }
      } catch (err) {
        console.error('Failed to fetch project', err);
      }
    };
    fetchProject();
  }, [projectId]);

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
      className="bg-[var(--bg)] text-[var(--text-primary)] relative"
    >
      <ProjectSidebar project={currentProject} />

      {/* Main Content Area */}
      <div
        style={{ flex: 1, minWidth: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}
        className="bg-[var(--bg)]"
      >
        <ProjectHeader />
        
        <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          {/* We pass the project down to the outlet context */}
          <Outlet context={{ openAgent: () => setIsAgentOpen(true), project: currentProject }} />
        </main>
      </div>

      <AgentPanel 
        projectId={projectId || 1} 
        isOpen={isAgentOpen} 
        onClose={() => setIsAgentOpen(false)} 
      />
    </div>
  );
}
