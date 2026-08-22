import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import PageContainer from './PageContainer';

export default function WorkspaceLayout({ workspaceName }) {
  return (
    <div className="flex h-screen bg-[#111111] text-gray-100 overflow-hidden">
      <Sidebar workspaceName={workspaceName} />

      {/* MainArea: flex-1 takes remaining horizontal space and handles ALL vertical scrolling */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        <Topbar workspaceName={workspaceName} />
        
        {/* Page content flows naturally without nested scrollbars */}
        <main className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
