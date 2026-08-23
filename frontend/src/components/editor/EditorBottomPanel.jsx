import React, { useState } from 'react';
import { X, Plus, Trash2, ChevronDown, SplitSquareVertical } from 'lucide-react';

export default function EditorBottomPanel() {
  const [activeTab, setActiveTab] = useState('Terminal');
  
  const tabs = ['Problems', 'Output', 'Debug Console', 'Terminal'];

  return (
    <div style={{
      height: '300px', background: '#181818', borderTop: '1px solid #2b2b2b',
      display: 'flex', flexDirection: 'column', flexShrink: 0, color: '#cccccc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Panel Header / Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {tabs.map(tab => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 12px', fontSize: '11px', cursor: 'pointer', userSelect: 'none',
                color: activeTab === tab ? '#e7e7e7' : '#888888',
                borderBottom: activeTab === tab ? '1px solid #007acc' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
              className="hover:text-[var(--text-primary)]"
            >
              {tab}
              {tab === 'Problems' && (
                <span style={{ 
                  background: '#007acc', color: '#fff', borderRadius: '50%', 
                  width: '16px', height: '16px', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', fontSize: '10px' 
                }}>2</span>
              )}
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '8px', color: '#888' }}>
          {activeTab === 'Terminal' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="hover:text-[var(--text-primary)]">bash <X size={12} /></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="hover:text-[var(--text-primary)]"><Plus size={14} /><ChevronDown size={14} /></span>
              <SplitSquareVertical size={14} style={{ cursor: 'pointer' }} className="hover:text-[var(--text-primary)]" />
              <Trash2 size={14} style={{ cursor: 'pointer' }} className="hover:text-[var(--text-primary)]" />
              <X size={14} style={{ cursor: 'pointer' }} className="hover:text-[var(--text-primary)]" />
            </div>
          )}
        </div>
      </div>

      {/* Panel Content */}
      <div style={{ flex: 1, padding: '8px 16px', overflowY: 'auto', fontFamily: 'Consolas, monospace', fontSize: '13px', lineHeight: 1.6 }}>
        {activeTab === 'Terminal' && (
          <div>
            <div style={{ display: 'flex' }}>
              <span style={{ color: '#cccccc' }}>PS C:\Users\Libin\INNOFUSION\devcollab&gt;</span>
              <span style={{ display: 'inline-block', width: '8px', height: '16px', background: '#ccc', animation: 'blink 1s step-end infinite', marginLeft: '4px' }} />
            </div>
            <div style={{ color: '#cccccc', marginLeft: '32px' }}>
              frontend/src/App.jsx<br/>
              frontend/src/components/board/KanbanColumn.jsx<br/>
              frontend/src/components/board/KanbanView.jsx<br/>
              frontend/src/components/board/TaskModal.jsx<br/>
              frontend/src/components/project/ProjectSidebar.jsx<br/>
              frontend/src/pages/projects/ProjectBoardPage.jsx<br/>
              frontend/src/pages/projects/ProjectMembersPage.jsx<br/>
              frontend/src/store/authStore.js
            </div>
            <div style={{ color: '#cccccc' }}>Please commit your changes or stash them before you switch branches.<br/>Aborting</div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
               <span style={{ color: '#007acc', fontSize: '18px', marginRight: '4px' }}>●</span>
               <span style={{ color: '#cccccc' }}>PS C:\Users\Libin\INNOFUSION\devcollab&gt; git switch -c feat/dash</span>
            </div>
            <div style={{ color: '#cccccc' }}>Switched to a new branch 'feat/dash'</div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
               <span style={{ color: '#888', fontSize: '18px', marginRight: '4px' }}>○</span>
               <span style={{ color: '#cccccc' }}>PS C:\Users\Libin\INNOFUSION\devcollab&gt;</span>
            </div>
            
            <style>
              {`
                @keyframes blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0; }
                }
              `}
            </style>
          </div>
        )}
        
        {activeTab !== 'Terminal' && (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            No content available for {activeTab}.
          </div>
        )}
      </div>
    </div>
  );
}
