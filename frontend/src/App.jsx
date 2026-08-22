import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

import WorkspaceLayout from './components/layout/WorkspaceLayout';
import WorkspaceOverview from './pages/WorkspaceOverview';

import ProjectLayout from './components/project/ProjectLayout';
import PlaceholderPage from './components/project/PlaceholderPage';
import ProjectOverviewPage  from './pages/projects/ProjectOverviewPage';
import ProjectBoardPage     from './pages/projects/ProjectBoardPage';
import ProjectActivityPage  from './pages/projects/ProjectActivityPage';
import ProjectMembersPage   from './pages/projects/ProjectMembersPage';
import ProjectWikiPage      from './pages/projects/ProjectWikiPage';
import ProjectSnippetsPage  from './pages/projects/ProjectSnippetsPage';
import ProjectEditorPage    from './pages/projects/ProjectEditorPage';
import ProjectChatPage      from './pages/projects/ProjectChatPage';
import ProjectSettingsPage  from './pages/projects/ProjectSettingsPage';
import ProjectSprintPage    from './pages/projects/ProjectSprintPage';
import ProjectWorkloadPage  from './pages/projects/ProjectWorkloadPage';
import ProjectMyTasksPage   from './pages/projects/ProjectMyTasksPage';
import ProjectMyTeamPage    from './pages/projects/ProjectMyTeamPage';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';

// src/App.jsx
// Thin wrapper — delegates all routing to AppRoutes.
// Theme is applied globally here via useTheme().

import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { useTheme } from './hooks/useTheme';
import './index.css';

function ThemeProvider({ children }) {
  // This ensures the dark/light class is applied to <html> at the top level
  useTheme();
  return children;
}

export default function App() {
  const [workspaceName, setWorkspaceName] = useState('');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* State B: Authenticated but might not have workspace -> /onboarding */}
        <Route element={<ProtectedRoute requireWorkspace={false} />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>
        
        {/* State C: Authenticated WITH workspace */}
        <Route element={<ProtectedRoute requireWorkspace={true} />}>
          
          {/* Redirect /dashboard to / so we can cleanly use root for WorkspaceLayout */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          
          {/* Dashboard / Workspace Level Routes */}
          <Route path="/" element={<WorkspaceLayout workspaceName={workspaceName} />}>
            <Route index element={<WorkspaceOverview setWorkspaceName={setWorkspaceName} />} />
            <Route path="projects" element={<div className="p-12 text-center text-xl text-gray-400">Projects Module - Coming Soon</div>} />
            <Route path="activity" element={<div className="p-12 text-center text-xl text-gray-400">Activity Module - Coming Soon</div>} />
            <Route path="members" element={<div className="p-12 text-center text-xl text-gray-400">Members Module - Coming Soon</div>} />
            <Route path="billing" element={<div className="p-12 text-center text-xl text-gray-400">Billing Module - Coming Soon</div>} />
            <Route path="settings" element={<div className="p-12 text-center text-xl text-gray-400">Settings Module - Coming Soon</div>} />
            <Route path="ai" element={<div className="p-12 text-center text-xl text-gray-400">AI Assistant - Coming Soon</div>} />
          </Route>
          
          {/* Projects (Specific project view) */}
          <Route path="/projects/:projectId" element={<ProjectLayout />}>
            <Route index element={<Navigate to="overview" replace />} />

            {/* PROJECT MANAGEMENT */}
            <Route path="overview"  element={<ProjectOverviewPage />} />
            <Route path="board"     element={<ProjectBoardPage />} />
            <Route path="activity"  element={<ProjectActivityPage />} />
            <Route path="members"   element={<ProjectMembersPage />} />
            <Route path="sprint"    element={<ProjectSprintPage />} />
            <Route path="workload"  element={<ProjectWorkloadPage />} />
            <Route path="mytasks"   element={<ProjectMyTasksPage />} />
            <Route path="myteam"    element={<ProjectMyTeamPage />} />

            {/* KNOWLEDGE & DEV */}
            <Route path="wiki"      element={<ProjectWikiPage />} />
            <Route path="snippets"  element={<ProjectSnippetsPage />} />
            <Route path="editor"    element={<ProjectEditorPage />} />

            {/* TEAM & AI */}
            <Route path="chat"      element={<ProjectChatPage />} />
            <Route path="ai"        element={<PlaceholderPage title="AI Assistant" subtitle="Context-aware project intelligence — coming soon." />} />

            {/* SETTINGS */}
            <Route path="settings"  element={<ProjectSettingsPage />} />
          </Route>
        </Route>

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  );
}
