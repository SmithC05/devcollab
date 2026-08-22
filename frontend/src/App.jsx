import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProjectLayout from './components/project/ProjectLayout';
import PlaceholderPage from './components/project/PlaceholderPage';
import ProjectOverviewPage  from './pages/projects/ProjectOverviewPage';
import ProjectBoardPage     from './pages/projects/ProjectBoardPage';
import ProjectActivityPage  from './pages/projects/ProjectActivityPage';
import ProjectMembersPage   from './pages/projects/ProjectMembersPage';
import ProjectWikiPage      from './pages/projects/ProjectWikiPage';
import ProjectSnippetsPage  from './pages/projects/ProjectSnippetsPage';
import ProjectChatPage      from './pages/projects/ProjectChatPage';
import './index.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/projects/P1/overview" replace />} />

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
      </Routes>
    </Router>
  );
}
