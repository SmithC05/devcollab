import React from 'react';
import { Copy, Search, GitBranch, PlaySquare, Blocks, Settings, UserCircle, Hexagon } from 'lucide-react';

export default function ActivityBar() {
  return (
    <div style={{
      width: '48px', minWidth: '48px', background: '#181818',
      borderRight: '1px solid #2b2b2b', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', alignItems: 'center', padding: '12px 0',
      color: '#858585'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
        
        {/* Active item */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%', cursor: 'pointer', color: '#fff' }}>
          <div style={{ position: 'absolute', left: 0, top: '-4px', bottom: '-4px', width: '2px', background: '#007acc' }} />
          <Copy size={24} strokeWidth={1.5} />
        </div>
        
        {/* Search */}
        <Search size={24} strokeWidth={1.5} style={{ cursor: 'pointer' }} className="hover:text-white" />
        
        {/* Source Control with Badge */}
        <div style={{ position: 'relative', cursor: 'pointer' }} className="hover:text-white">
          <GitBranch size={24} strokeWidth={1.5} />
          <div style={{
            position: 'absolute', right: '-6px', bottom: '-2px',
            background: '#007acc', color: '#fff', fontSize: '9px',
            fontWeight: 'bold', width: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', border: '2px solid #181818'
          }}>
            21
          </div>
        </div>
        
        {/* Run and Debug */}
        <PlaySquare size={24} strokeWidth={1.5} style={{ cursor: 'pointer' }} className="hover:text-white" />
        
        {/* Extensions with Warning Badge */}
        <div style={{ position: 'relative', cursor: 'pointer' }} className="hover:text-white">
          <Blocks size={24} strokeWidth={1.5} />
          <div style={{
            position: 'absolute', right: '-4px', bottom: '-2px',
            color: '#cca700', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#181818', borderRadius: '50%'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="#181818" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13" stroke="#000"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="#000"/></svg>
          </div>
        </div>

        {/* Docker Container icon simulation */}
        <Hexagon size={24} strokeWidth={1.5} style={{ cursor: 'pointer' }} className="hover:text-white" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
        <UserCircle size={24} strokeWidth={1.5} style={{ cursor: 'pointer' }} className="hover:text-white" />
        <Settings size={24} strokeWidth={1.5} style={{ cursor: 'pointer' }} className="hover:text-white" />
      </div>
    </div>
  );
}
