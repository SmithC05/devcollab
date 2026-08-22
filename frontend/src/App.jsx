import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import WorkspaceLayout from './components/layout/WorkspaceLayout';
import WorkspaceOverview from './pages/WorkspaceOverview';

export default function App() {
  const [workspaceName, setWorkspaceName] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<WorkspaceLayout workspaceName={workspaceName} />}>
          <Route index element={<WorkspaceOverview setWorkspaceName={setWorkspaceName} />} />
          <Route path="projects" element={<div className="p-12 text-center text-xl text-gray-400">Projects Module - Coming Soon</div>} />
          <Route path="activity" element={<div className="p-12 text-center text-xl text-gray-400">Activity Module - Coming Soon</div>} />
          <Route path="members" element={<div className="p-12 text-center text-xl text-gray-400">Members Module - Coming Soon</div>} />
          <Route path="billing" element={<div className="p-12 text-center text-xl text-gray-400">Billing Module - Coming Soon</div>} />
          <Route path="settings" element={<div className="p-12 text-center text-xl text-gray-400">Settings Module - Coming Soon</div>} />
          <Route path="ai" element={<div className="p-12 text-center text-xl text-gray-400">AI Assistant - Coming Soon</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
