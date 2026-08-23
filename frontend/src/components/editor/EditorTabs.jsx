import React from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { X } from 'lucide-react';

export default function EditorTabs() {
  const { files, openTabs, activeFileId, dirtyFiles, openFile, closeTab } = useEditorStore();

  if (openTabs.length === 0) return null;

  return (
    <div style={{
      display: 'flex', background: '#181818', borderBottom: '1px solid #181818',
      overflowX: 'auto', flexShrink: 0
    }} className="scrollbar-hide">
      {openTabs.map((tabId) => {
        const file = files.find(f => f.id === tabId);
        if (!file) return null;
        
        const isActive = activeFileId === tabId;
        const isDirty = dirtyFiles.includes(tabId);
        
        return (
          <div
            key={tabId}
            onClick={() => openFile(tabId)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px 6px 16px', background: isActive ? '#1e1e1e' : '#2b2b2b',
              color: isActive ? '#fff' : '#888', cursor: 'pointer', fontSize: '13px',
              borderRight: '1px solid #181818',
              borderTop: isActive ? '1px solid #007acc' : '1px solid transparent',
              minWidth: '120px'
            }}
          >
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {file.name}
            </span>
            
            <div 
              style={{ padding: '2px', borderRadius: '4px', display: 'flex', color: isActive ? '#ccc' : '#666' }}
              className="hover:bg-white/10 hover:text-[var(--text-primary)]"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tabId);
              }}
            >
              {isDirty ? (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cca700', margin: '4px' }} />
              ) : (
                <X size={14} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
