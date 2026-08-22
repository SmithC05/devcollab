import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import EditorHeader from '../../components/editor/EditorHeader';
import ActivityBar from '../../components/editor/ActivityBar';
import FileExplorer from '../../components/editor/FileExplorer';
import EditorTabs from '../../components/editor/EditorTabs';
import MonacoCodeEditor from '../../components/editor/MonacoCodeEditor';
import EditorBottomPanel from '../../components/editor/EditorBottomPanel';
import EditorStatusBar from '../../components/editor/EditorStatusBar';

export default function ProjectEditorPage() {
  const { can } = useAuthStore();

  // Basic RBAC check
  if (!can('EDITOR_VIEW')) {
    return (
      <div style={{ padding: '32px', color: '#ff4a4a' }}>
        You do not have permission to view the Editor.
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#1e1e1e', fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <EditorHeader />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ActivityBar />
        <FileExplorer />
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <EditorTabs />
            <MonacoCodeEditor />
          </div>
          <EditorBottomPanel />
        </div>
      </div>
      
      <EditorStatusBar />
    </div>
  );
}
