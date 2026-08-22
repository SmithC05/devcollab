import { Outlet } from 'react-router-dom';
import ProjectSidebar from './ProjectSidebar';

export default function ProjectLayout() {
  return (
    <div
      style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}
      className="bg-[#0d0d0f] text-[#f5f5f5] font-sans"
    >
      <ProjectSidebar />

      {/* Main Content Area */}
      <main
        style={{ flex: 1, minWidth: 0, height: '100vh', overflow: 'auto' }}
        className="bg-[#0d0d0f]"
      >
        <Outlet />
      </main>
    </div>
  );
}
