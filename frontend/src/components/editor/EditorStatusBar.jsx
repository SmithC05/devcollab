import React from 'react';
import { useEditorStore } from '../../stores/editorStore';

export default function EditorStatusBar() {
  const { files, activeFileId } = useEditorStore();
  
  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div style={{
      height: '22px', background: '#007acc', color: '#ffffff',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 8px', fontSize: '11px', flexShrink: 0,
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="hover:bg-white/20 px-1 rounded">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          DevCollab IDE Active
        </span>
        <span style={{ cursor: 'pointer' }} className="hover:bg-white/20 px-1 rounded">main*</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ cursor: 'pointer' }} className="hover:bg-white/20 px-1 rounded">UTF-8</span>
        {activeFile ? (
          <>
            <span style={{ cursor: 'pointer' }} className="hover:bg-white/20 px-1 rounded">Ln 1, Col 1</span>
            <span style={{ textTransform: 'capitalize', cursor: 'pointer' }} className="hover:bg-white/20 px-1 rounded">
              {activeFile.language || 'Plain Text'}
            </span>
          </>
        ) : (
          <span style={{ cursor: 'pointer' }} className="hover:bg-white/20 px-1 rounded">Ln 1, Col 1</span>
        )}
        <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} className="hover:bg-white/20 px-1 rounded">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
           DevCollab v2.5
        </span>
      </div>
    </div>
  );
}
