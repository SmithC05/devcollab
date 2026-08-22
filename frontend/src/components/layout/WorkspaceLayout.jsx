import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function WorkspaceLayout({ workspaceName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg,var(--bg))] text-[var(--text-primary)]">
      {/* Sidebar: desktop always visible, mobile via drawer prop */}
      <Sidebar
        workspaceName={workspaceName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MainArea: takes remaining space, handles vertical scroll */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        <Topbar
          workspaceName={workspaceName}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 min-w-0 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
