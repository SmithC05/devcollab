import React from 'react';
import FileTree from './FileTree';
import { useEditorStore } from '../../stores/editorStore';
import { useAuthStore } from '../../store/authStore';

export default function FileExplorer() {
  const { files, createFolder, createFile, loadWorkspace } = useEditorStore();
  const { can } = useAuthStore();
  const isEmpty = files.length === 0;

  const handleOpenFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const newFiles = [];
      const rootId = `folder-${Date.now()}`;
      
      newFiles.push({
        id: rootId,
        name: dirHandle.name,
        type: 'folder',
        parentId: null
      });

      const processHandle = async (handle, parentId) => {
        if (handle.kind === 'file') {
          const file = await handle.getFile();
          if (file.size > 2000000) return; // Skip files > 2MB
          
          const text = await file.text();
          let ext = file.name.split('.').pop();
          let lang = 'plaintext';
          if (ext === 'js' || ext === 'jsx') lang = 'javascript';
          if (ext === 'ts' || ext === 'tsx') lang = 'typescript';
          if (ext === 'json') lang = 'json';
          if (ext === 'md') lang = 'markdown';
          if (ext === 'css') lang = 'css';
          if (ext === 'html') lang = 'html';
          if (ext === 'py') lang = 'python';

          newFiles.push({
            id: `file-${Math.random().toString(36).substr(2, 9)}`,
            name: handle.name,
            type: 'file',
            language: lang,
            parentId: parentId,
            content: text
          });
        } else if (handle.kind === 'directory') {
          if (handle.name === 'node_modules' || handle.name === '.git') return;
          
          const folderId = `folder-${Math.random().toString(36).substr(2, 9)}`;
          newFiles.push({
            id: folderId,
            name: handle.name,
            type: 'folder',
            parentId: parentId
          });
          
          for await (const entry of handle.values()) {
            await processHandle(entry, folderId);
          }
        }
      };

      for await (const entry of dirHandle.values()) {
        await processHandle(entry, rootId);
      }

      loadWorkspace(newFiles);
    } catch (err) {
      console.log('Folder selection cancelled or failed:', err);
    }
  };

  return (
    <div style={{
      width: '260px', minWidth: '260px', background: '#181818',
      borderRight: '1px solid #2b2b2b', display: 'flex', flexDirection: 'column',
      height: '100%', overflowY: 'auto'
    }} className="scrollbar-hide">
      <div style={{
        padding: '12px 16px', fontSize: '11px', fontWeight: 600,
        color: '#ccc', display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <span>EXPLORER</span>
      </div>

      {!isEmpty && (
        <div style={{
          padding: '4px 16px', fontSize: '11px', fontWeight: 700,
          color: '#ccc', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          WORKSPACE
        </div>
      )}
      
      {isEmpty ? (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: '#ccc', fontSize: '13px', margin: 0, textAlign: 'center' }}>
            No folder or file opened yet.
          </p>
          {can('EDITOR_CREATE_FILE') && (
            <>
              <button onClick={handleOpenFolder} style={blueBtnStyle}>
                Open Folder
              </button>
              <button onClick={() => {
                const name = window.prompt("File Name:");
                if (name) createFile(null, name, 'javascript');
              }} style={grayBtnStyle}>
                Create File
              </button>
            </>
          )}
        </div>
      ) : (
        <FileTree />
      )}
    </div>
  );
}

const blueBtnStyle = {
  background: '#007acc', color: '#fff', border: 'none', borderRadius: '2px',
  padding: '6px 16px', fontSize: '13px', cursor: 'pointer', textAlign: 'center',
  width: '100%'
};

const grayBtnStyle = {
  background: '#333333', color: '#ccc', border: 'none', borderRadius: '2px',
  padding: '6px 16px', fontSize: '13px', cursor: 'pointer', textAlign: 'center',
  width: '100%'
};
