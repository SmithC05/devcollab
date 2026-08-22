// src/routes/AppRoutes.jsx
// All application routes with guards.
// Route guard logic:
//   Not authenticated → /login
//   Authenticated, no workspaces → /onboarding
//   Authenticated, has workspaces, no active → /select-workspace
//   Authenticated, activeWorkspace exists → /dashboard

import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import LoginPage from '../components/auth/LoginPage';
import OnboardingPage from '../components/auth/OnboardingPage';
import SelectWorkspacePage from '../components/workspace/SelectWorkspacePage';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import WorkspaceOverview from '../components/workspace/WorkspaceOverview';
import ProjectLayout from '../components/project/ProjectLayout';
import PlaceholderPage from '../components/project/PlaceholderPage';
import ProjectOverviewPage  from '../components/project/ProjectOverviewPage';
import ProjectBoardPage     from '../components/project/ProjectBoardPage';
import ProjectActivityPage  from '../components/project/ProjectActivityPage';
import ProjectMembersPage   from '../components/project/ProjectMembersPage';
import ProjectWikiPage      from '../components/project/ProjectWikiPage';
import ProjectSnippetsPage  from '../components/project/ProjectSnippetsPage';
import ProjectEditorPage    from '../components/project/ProjectEditorPage';
import ProjectChatPage      from '../components/project/ProjectChatPage';
import ProjectSettingsPage  from '../components/project/ProjectSettingsPage';
import ProjectSprintPage    from '../components/project/ProjectSprintPage';
import ProjectWorkloadPage  from '../components/project/ProjectWorkloadPage';
import ProjectMyTasksPage   from '../components/project/ProjectMyTasksPage';
import ProjectMyTeamPage    from '../components/project/ProjectMyTeamPage';
import AuthCallbackPage     from '../pages/AuthCallbackPage';
import IntelligenceLayout        from '../features/devcollab-intelligence/pages/IntelligenceLayout';
import FoundationPreviewPage     from '../features/devcollab-intelligence/pages/FoundationPreviewPage';
import EngineeringCommandCenter  from '../features/devcollab-intelligence/pages/EngineeringCommandCenter';
import OrganizationIntelligence  from '../features/devcollab-intelligence/pages/OrganizationIntelligence';
import DecisionPoint             from '../features/devcollab-intelligence/pages/DecisionPoint';
import SimulationCenter          from '../features/devcollab-intelligence/pages/SimulationCenter';
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

import WorkspaceProjectsPage from '../components/workspace/WorkspaceProjectsPage';
import WorkspaceActivityPage from '../components/workspace/WorkspaceActivityPage';
import WorkspaceMembersPage from '../components/workspace/WorkspaceMembersPage';
import WorkspaceBillingPage from '../components/workspace/WorkspaceBillingPage';
import WorkspaceSettingsPage from '../components/workspace/WorkspaceSettingsPage';
import WorkspaceAIAssistantPage from '../components/workspace/WorkspaceAIAssistantPage';

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

      {/* Auth Callback (Public) */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

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

      {/* DevCollab Intelligence — Isolated experience */}
      <Route path="/intelligence" element={<IntelligenceLayout />}>
        <Route index element={<EngineeringCommandCenter />} />
        <Route path="foundation-preview" element={<FoundationPreviewPage />} />
        {/* Future routes — placeholder until Phase 2–4 */}
        <Route path="project/:id"     element={<PlaceholderPage title="Project Intelligence" subtitle="Project-level engineering state — Phase 2" />} />
        <Route path="organization"    element={<OrganizationIntelligence />} />
        <Route path="member/:id"      element={<PlaceholderPage title="Member Intelligence" subtitle="Member capacity &amp; context — Phase 2" />} />
        <Route path="decision/:id"    element={<DecisionPoint />} />
        <Route path="simulation/:id"  element={<SimulationCenter />} />
      </Route>

      {/* Default */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
