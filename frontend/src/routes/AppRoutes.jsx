// src/routes/AppRoutes.jsx
// All application routes with guards.
// Route guard logic:
//   Not authenticated → /login
//   Authenticated, no workspaces → /onboarding
//   Authenticated, has workspaces, no active → /select-workspace
//   Authenticated, activeWorkspace exists → /dashboard

import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoginPage from '../pages/LoginPage';
import OnboardingPage from '../pages/OnboardingPage';
import SelectWorkspacePage from '../pages/SelectWorkspacePage';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import WorkspaceOverview from '../pages/WorkspaceOverview';
import ProjectLayout from '../components/project/ProjectLayout';
import PlaceholderPage from '../components/project/PlaceholderPage';
import ProjectOverviewPage  from '../pages/projects/ProjectOverviewPage';
import ProjectBoardPage     from '../pages/projects/ProjectBoardPage';
import ProjectActivityPage  from '../pages/projects/ProjectActivityPage';
import ProjectMembersPage   from '../pages/projects/ProjectMembersPage';
import ProjectWikiPage      from '../pages/projects/ProjectWikiPage';
import ProjectSnippetsPage  from '../pages/projects/ProjectSnippetsPage';
import ProjectEditorPage    from '../pages/projects/ProjectEditorPage';
import ProjectChatPage      from '../pages/projects/ProjectChatPage';
import ProjectSettingsPage  from '../pages/projects/ProjectSettingsPage';
import ProjectSprintPage    from '../pages/projects/ProjectSprintPage';
import ProjectWorkloadPage  from '../pages/projects/ProjectWorkloadPage';
import ProjectMyTasksPage   from '../pages/projects/ProjectMyTasksPage';
import ProjectMyTeamPage    from '../pages/projects/ProjectMyTeamPage';
// ── Guards ────────────────────────────────────────────────────────────────

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, workspaces } = useAuthStore();
  
  if (isAuthenticated) {
    if (workspaces?.length > 0) return <Navigate to="/select-workspace" replace />;
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
}

function RequireOnboarding({ children }) {
  const { isAuthenticated, workspaces } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (workspaces?.length > 0) return <Navigate to="/select-workspace" replace />;
  
  return children;
}

function RequireSelectWorkspace({ children }) {
  const { isAuthenticated, workspaces } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!workspaces || workspaces.length === 0) return <Navigate to="/onboarding" replace />;
  
  return children;
}

function RequireWorkspace({ children }) {
  const { isAuthenticated, workspaces, activeWorkspace } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!workspaces || workspaces.length === 0) return <Navigate to="/onboarding" replace />;
  if (!activeWorkspace) return <Navigate to="/select-workspace" replace />;
  
  return children;
}

import WorkspaceProjectsPage from '../pages/workspace/WorkspaceProjectsPage';
import WorkspaceActivityPage from '../pages/workspace/WorkspaceActivityPage';
import WorkspaceMembersPage from '../pages/workspace/WorkspaceMembersPage';
import WorkspaceBillingPage from '../pages/workspace/WorkspaceBillingPage';
import WorkspaceSettingsPage from '../pages/workspace/WorkspaceSettingsPage';
import WorkspaceAIAssistantPage from '../pages/workspace/WorkspaceAIAssistantPage';

// ── Routes ────────────────────────────────────────────────────────────────

export default function AppRoutes() {
  const { activeWorkspace } = useAuthStore();
  const workspaceName = activeWorkspace?.name || '';

  return (
    <Routes>
      {/* Public (login/register in one shell) */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      {/* Onboarding — needs auth, no workspaces yet */}
      <Route
        path="/onboarding"
        element={
          <RequireOnboarding>
            <OnboardingPage />
          </RequireOnboarding>
        }
      />

      {/* Select Workspace — needs auth + at least one workspace */}
      <Route
        path="/select-workspace"
        element={
          <RequireSelectWorkspace>
            <SelectWorkspacePage />
          </RequireSelectWorkspace>
        }
      />

      {/* Dashboard — needs auth + activeWorkspace */}
      <Route
        path="/dashboard"
        element={
          <RequireWorkspace>
            <WorkspaceLayout workspaceName={workspaceName} />
          </RequireWorkspace>
        }
      >
        <Route index element={<WorkspaceOverview setWorkspaceName={() => {}} />} />
        <Route path="projects" element={<WorkspaceProjectsPage />} />
        <Route path="activity" element={<WorkspaceActivityPage />} />
        <Route path="members" element={<WorkspaceMembersPage />} />
        <Route path="billing" element={<WorkspaceBillingPage />} />
        <Route path="settings" element={<WorkspaceSettingsPage />} />
        <Route path="ai" element={<WorkspaceAIAssistantPage />} />
      </Route>

      {/* Project routes */}
      <Route
        path="/projects/:projectId"
        element={
          <RequireWorkspace>
            <ProjectLayout />
          </RequireWorkspace>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview"  element={<ProjectOverviewPage />} />
        <Route path="board"     element={<ProjectBoardPage />} />
        <Route path="activity"  element={<ProjectActivityPage />} />
        <Route path="members"   element={<ProjectMembersPage />} />
        <Route path="sprint"    element={<ProjectSprintPage />} />
        <Route path="workload"  element={<ProjectWorkloadPage />} />
        <Route path="mytasks"   element={<ProjectMyTasksPage />} />
        <Route path="myteam"    element={<ProjectMyTeamPage />} />
        <Route path="wiki"      element={<ProjectWikiPage />} />
        <Route path="snippets"  element={<ProjectSnippetsPage />} />
        <Route path="editor"    element={<ProjectEditorPage />} />
        <Route path="chat"      element={<ProjectChatPage />} />
        <Route path="ai"        element={<PlaceholderPage title="AI Assistant" subtitle="Context-aware project intelligence — coming soon." />} />
        <Route path="settings"  element={<ProjectSettingsPage />} />
      </Route>

      {/* Default */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
