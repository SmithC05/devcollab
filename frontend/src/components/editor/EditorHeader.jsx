import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useEditorStore } from '../../stores/editorStore';

export default function EditorHeader() {
  const { can } = useAuthStore();
  const { createFile } = useEditorStore();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 8px', background: '#181818',
      color: '#cccccc', flexShrink: 0, height: '30px',
      fontFamily: 'system-ui, sans-serif', fontSize: '13px'
    }}>
      
      {/* Left Menu Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ padding: '0 8px', color: '#007acc' }}>
           <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 4.5l5.5 11H6.5L12 6.5z"/></svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
          <span 
            style={menuItemStyle} 
            className="hover:bg-white/10"
            onClick={() => {
              if (can('editor.file.create')) {
                const name = window.prompt("New File Name:");
                if (name) createFile(null, name, 'javascript');
              }
            }}
          >
            File
          </span>
          <span style={menuItemStyle} className="hover:bg-white/10">Edit</span>
          <span style={menuItemStyle} className="hover:bg-white/10">Selection</span>
          <span style={menuItemStyle} className="hover:bg-white/10">View</span>
          <span style={menuItemStyle} className="hover:bg-white/10">Go</span>
          <span style={menuItemStyle} className="hover:bg-white/10">Run</span>
          <span style={menuItemStyle} className="hover:bg-white/10">Terminal</span>
          <span style={menuItemStyle} className="hover:bg-white/10">Help</span>
        </div>
      </div>
    </div>
  );
}

const menuItemStyle = {
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: '4px'
};
