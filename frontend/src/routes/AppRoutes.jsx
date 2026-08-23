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
import ProjectOverviewPage from '../components/project/ProjectOverviewPage';
import ProjectBoardPage from '../components/project/ProjectBoardPage';
import ProjectActivityPage from '../components/project/ProjectActivityPage';
import ProjectMembersPage from '../components/project/ProjectMembersPage';
import ProjectWikiPage from '../components/project/ProjectWikiPage';
import ProjectSnippetsPage from '../components/project/ProjectSnippetsPage';
import ProjectEditorPage from '../components/project/ProjectEditorPage';
import ProjectChatPage from '../components/project/ProjectChatPage';
import ProjectSettingsPage from '../components/project/ProjectSettingsPage';
import ProjectSprintPage from '../components/project/ProjectSprintPage';
import ProjectWorkloadPage from '../components/project/ProjectWorkloadPage';
import ProjectMyTasksPage from '../components/project/ProjectMyTasksPage';
import ProjectMyTeamPage from '../components/project/ProjectMyTeamPage';
import AuthCallbackPage     from '../pages/AuthCallbackPage';
import IntelligenceLayout        from '../features/devcollab-intelligence/pages/IntelligenceLayout';
import FoundationPreviewPage     from '../features/devcollab-intelligence/pages/FoundationPreviewPage';
import OrganizationIntelligence  from '../features/devcollab-intelligence/pages/OrganizationIntelligence/OrganizationIntelligence';
import DecisionPoint             from '../features/devcollab-intelligence/pages/DecisionPoint';
import SimulationCenter          from '../features/devcollab-intelligence/pages/SimulationCenter';
import KnowledgeTransfer         from '../features/devcollab-intelligence/pages/KnowledgeTransfer';
import JudgeMode                 from '../features/devcollab-intelligence/pages/JudgeMode';
import DevCollabDemoMode, { DemoStartScreen } from '../features/devcollab-intelligence/pages/DevCollabDemoMode';
import InvitationPage       from '../pages/InvitationPage';
import LandingPage          from '../pages/LandingPage';
// L-03 FIX: Moved these imports from mid-file to top where they belong
import WorkspaceProjectsPage from '../components/workspace/WorkspaceProjectsPage';
import WorkspaceActivityPage from '../components/workspace/WorkspaceActivityPage';
import WorkspaceMembersPage from '../components/workspace/WorkspaceMembersPage';
import WorkspaceBillingPage from '../components/workspace/WorkspaceBillingPage';
import WorkspaceSettingsPage from '../components/workspace/WorkspaceSettingsPage';
import WorkspaceAIAssistantPage from '../components/workspace/WorkspaceAIAssistantPage';
// ── Guards ────────────────────────────────────────────────────────────────

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading, workspaces, activeWorkspace } = useAuthStore();

  // BUG-06/20 FIX: Don't redirect while the /me call is still in flight.
  // Previously isLoading wasn't checked, so guards fired during hydration
  // before workspaces had loaded, causing false redirects to /login.
  if (isLoading) return null;

  if (isAuthenticated) {
    // BUG-14 FIX: If they already have an active workspace go straight to dashboard
    if (activeWorkspace) return <Navigate to="/dashboard" replace />;
    if (workspaces?.length > 0) return <Navigate to="/select-workspace" replace />;
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function RequireOnboarding({ children }) {
  const { isAuthenticated, isLoading, workspaces } = useAuthStore();
  if (isLoading) return null;  // BUG-20 FIX: wait for hydration

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (workspaces?.length > 0) return <Navigate to="/select-workspace" replace />;

  return children;
}

function RequireSelectWorkspace({ children }) {
  const { isAuthenticated, isLoading, workspaces } = useAuthStore();
  if (isLoading) return null;  // BUG-20 FIX: wait for hydration

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!workspaces || workspaces.length === 0) return <Navigate to="/onboarding" replace />;

  return children;
}

function RequireWorkspace({ children }) {
  const { isAuthenticated, isLoading, workspaces, activeWorkspace } = useAuthStore();
  if (isLoading) return null;  // BUG-06 FIX: wait for hydration

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!workspaces || workspaces.length === 0) return <Navigate to="/onboarding" replace />;
  if (!activeWorkspace) return <Navigate to="/select-workspace" replace />;

  return children;
}

// ── Routes ────────────────────────────────────────────────────────────────

export default function AppRoutes() {
  const { activeWorkspace } = useAuthStore();


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

      {/* Invitation Landing */}
      <Route path="/invitations/:token" element={<InvitationPage />} />

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
            {/* BUG-15 FIX: WorkspaceLayout reads workspace from store, no prop needed */}
            <WorkspaceLayout />
          </RequireWorkspace>
        }
      >
        <Route index element={<WorkspaceOverview />} />

        <Route path="projects" element={<WorkspaceProjectsPage />} />
        <Route path="activity" element={<WorkspaceActivityPage />} />
        <Route path="members" element={<WorkspaceMembersPage />} />
        <Route path="billing" element={<WorkspaceBillingPage />} />
        <Route path="settings" element={<WorkspaceSettingsPage />} />
        <Route path="ai" element={<WorkspaceAIAssistantPage />} />
        
        {/* ── Phase Integration 1: Unified Intelligence Experience ── */}
        <Route path="intelligence">
          <Route index element={<Navigate to="organization" replace />} />
          <Route path="organization" element={<OrganizationIntelligence />} />
          <Route path="decision/:id" element={<DecisionPoint />} />
          <Route path="simulation/task/:id" element={<SimulationCenter />} />
          <Route path="simulation/demo/:id" element={<SimulationCenter />} />
          <Route path="knowledge-transfer/:id" element={<KnowledgeTransfer />} />
          <Route path="demo" element={<DevCollabDemoMode />} />
        </Route>
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
        <Route path="overview" element={<ProjectOverviewPage />} />
        <Route path="board" element={<ProjectBoardPage />} />
        <Route path="activity" element={<ProjectActivityPage />} />
        <Route path="members" element={<ProjectMembersPage />} />
        <Route path="sprint" element={<ProjectSprintPage />} />
        <Route path="workload" element={<ProjectWorkloadPage />} />
        <Route path="mytasks" element={<ProjectMyTasksPage />} />
        <Route path="myteam" element={<ProjectMyTeamPage />} />
        <Route path="wiki" element={<ProjectWikiPage />} />
        <Route path="snippets" element={<ProjectSnippetsPage />} />
        <Route path="editor" element={<ProjectEditorPage />} />
        <Route path="chat" element={<ProjectChatPage />} />
        <Route path="ai" element={<PlaceholderPage title="AI Assistant" subtitle="Context-aware project intelligence — coming soon." />} />
        <Route path="settings" element={<ProjectSettingsPage />} />
      </Route>

      {/* ── Demo / Orchestration Mode (Standalone Layout) ── */}
      <Route path="/intelligence/demo" element={<DevCollabDemoMode />}>
        <Route index element={<DemoStartScreen />} />
        <Route path="judge" element={<JudgeMode />} />
        <Route path="organization" element={<OrganizationIntelligence />} />
        <Route path="decision/:id" element={<DecisionPoint />} />
        <Route path="simulation/:id" element={<SimulationCenter />} />
        <Route path="knowledge-transfer/:id" element={<KnowledgeTransfer />} />
      </Route>


      {/* Default */}
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
