import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function WorkspaceLayout({ workspaceName }) {
  return (
    <div className="min-h-screen bg-[#111111] text-gray-100">
      <Sidebar workspaceName={workspaceName} />

      {/* MainShell: strict 220px offset */}
      <div
        className="flex flex-col min-h-screen bg-[#111111]"
        style={{ marginLeft: '220px', width: 'calc(100% - 220px)', boxSizing: 'border-box', minWidth: 0 }}
      >
        <Topbar workspaceName={workspaceName} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
