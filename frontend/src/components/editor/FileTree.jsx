import React, { useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useAuthStore } from '../../store/authStore';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Edit2, Trash2, Atom, FileJson, FileText, Hash, Braces } from 'lucide-react';

function getFileIcon(filename, language) {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'jsx' || ext === 'tsx') return <Atom size={14} color="#61dafb" />;
  if (ext === 'js' || ext === 'ts') return <span style={{ color: '#f7df1e', fontSize: '14px', fontWeight: 'bold' }}>JS</span>;
  if (ext === 'json') return <Braces size={14} color="#cb3837" />;
  if (ext === 'css') return <Hash size={14} color="#264de4" />;
  return <FileText size={14} color="#888" />;
}

function FileTreeNode({ item, level }) {
  const { files, expandedFolders, toggleFolder, activeFileId, dirtyFiles, renameFile, deleteFile, openFile } = useEditorStore();
  const { can } = useAuthStore();
  const [isHovered, setIsHovered] = useState(false);
  
  const isExpanded = expandedFolders.includes(item.id);
  const isActive = activeFileId === item.id;
  const isFolder = item.type === 'folder';
  const isDirty = dirtyFiles.includes(item.id);

  const children = files.filter(f => f.parentId === item.id).sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (isFolder) {
      toggleFolder(item.id);
    } else {
      openFile(item.id);
    }
  };

  const handleRename = (e) => {
    e.stopPropagation();
    const newName = window.prompt("New name:", item.name);
    if (newName && newName !== item.name) {
      renameFile(item.id, newName);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      deleteFile(item.id);
    }
  };

  // Create indentation guides
  const indentLines = [];
  for (let i = 0; i < level; i++) {
    indentLines.push(
      <div key={i} style={{ 
        position: 'absolute', 
        left: `${i * 12 + 10}px`, 
        top: 0, bottom: 0, 
        width: '1px', 
        background: '#444' 
      }} />
    );
  }

  const paddingLeft = `${level * 12 + 4}px`;

  return (
    <div>
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: '4px',
          padding: `2px 8px 2px ${paddingLeft}`, cursor: 'pointer', fontSize: '13px',
          background: isActive ? '#37373d' : (isHovered ? '#2a2d2e' : 'transparent'),
          color: isDirty ? '#e2c08d' : (isActive ? '#fff' : '#ccc'),
          userSelect: 'none',
        }}
      >
        {indentLines}

        <span style={{ display: 'flex', alignItems: 'center', width: '16px', color: '#ccc', zIndex: 1 }}>
          {isFolder ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span style={{width:'16px'}}></span>}
        </span>
        
        <span style={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
          {isFolder 
            ? (isExpanded ? <FolderOpen size={14} color="#cca700" fill="#cca700" fillOpacity={0.2} /> : <Folder size={14} color="#cca700" fill="#cca700" fillOpacity={0.2} />)
            : getFileIcon(item.name, item.language)
          }
        </span>
        
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, zIndex: 1, marginLeft: '4px' }}>
          {item.name}
        </span>

        {isDirty && !isHovered && (
          <span style={{ color: '#cca700', fontSize: '11px', fontWeight: 'bold', marginRight: '4px', zIndex: 1 }}>M</span>
        )}

        {isHovered && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
            {can('EDITOR_RENAME_FILE') && (
              <button onClick={handleRename} style={actionBtnStyle} title="Rename">
                <Edit2 size={12} />
              </button>
            )}
            {can('EDITOR_DELETE_FILE') && (
              <button onClick={handleDelete} style={actionBtnStyle} title="Delete">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {isFolder && isExpanded && (
        <div>
          {children.map(child => (
            <FileTreeNode key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree() {
  const { files } = useEditorStore();
  const rootItems = files.filter(f => f.parentId === null).sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div style={{ padding: '0 0 8px 0', display: 'flex', flexDirection: 'column' }}>
      {rootItems.map(item => (
        <FileTreeNode key={item.id} item={item} level={0} />
      ))}
    </div>
  );
}

const actionBtnStyle = {
  background: 'none', border: 'none', color: '#888',
  cursor: 'pointer', padding: '2px', borderRadius: '4px',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};
