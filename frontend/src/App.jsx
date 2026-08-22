import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProjectLayout from './components/project/ProjectLayout';
import PlaceholderPage from './components/project/PlaceholderPage';
import ProjectOverviewPage  from './pages/projects/ProjectOverviewPage';
import ProjectBoardPage     from './pages/projects/ProjectBoardPage';
import ProjectActivityPage  from './pages/projects/ProjectActivityPage';
import ProjectMembersPage   from './pages/projects/ProjectMembersPage';
import ProjectWikiPage      from './pages/projects/ProjectWikiPage';
import ProjectSnippetsPage  from './pages/projects/ProjectSnippetsPage';
import ProjectChatPage      from './pages/projects/ProjectChatPage';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import DashboardPlaceholder from './pages/DashboardPlaceholder';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* State B: Authenticated but might not have workspace -> /onboarding */}
        <Route element={<ProtectedRoute requireWorkspace={false} />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>
        
        {/* State C: Authenticated WITH workspace -> /dashboard */}
        <Route element={<ProtectedRoute requireWorkspace={true} />}>
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          
          {/* Projects */}
          <Route path="/projects/:projectId" element={<ProjectLayout />}>
            <Route index element={<Navigate to="overview" replace />} />

            {/* PROJECT MANAGEMENT */}
            <Route path="overview"  element={<ProjectOverviewPage />} />
            <Route path="board"     element={<ProjectBoardPage />} />
            <Route path="activity"  element={<ProjectActivityPage />} />
            <Route path="members"   element={<ProjectMembersPage />} />

            {/* KNOWLEDGE & DEV */}
            <Route path="wiki"      element={<ProjectWikiPage />} />
            <Route path="snippets"  element={<ProjectSnippetsPage />} />
            <Route path="editor"    element={<PlaceholderPage title="Editor" subtitle="Cloud-based code editor — coming in next phase." />} />

            {/* TEAM & AI */}
            <Route path="chat"      element={<ProjectChatPage />} />
            <Route path="ai"        element={<PlaceholderPage title="AI Assistant" subtitle="Context-aware project intelligence — coming soon." />} />
          </Route>
        </Route>

        {/* Redirect root to login, ProtectedRoute will handle redirecting to dashboard/onboarding if logged in */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
