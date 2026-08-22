import React, { useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '../../stores/editorStore';
import { useAuthStore } from '../../store/authStore';
import { Code2 } from 'lucide-react';

export default function MonacoCodeEditor() {
  const { files, activeFileId, updateFileContent, saveFile, createFile, loadWorkspace } = useEditorStore();
  const { can } = useAuthStore();
  
  const editorRef = useRef(null);
  
  const activeFile = files.find(f => f.id === activeFileId);
  const canEdit = can('editor.edit');
  const canSave = can('editor.edit');

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Add save command (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeFileId && canSave) {
        saveFile(activeFileId);
      }
    });
  };

  const handleEditorChange = useCallback((value) => {
    if (activeFileId && canEdit) {
      updateFileContent(activeFileId, value || '');
    }
  }, [activeFileId, updateFileContent, canEdit]);

  const handleOpenFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const newFiles = [];
      const rootId = `folder-${Date.now()}`;
      
      newFiles.push({ id: rootId, name: dirHandle.name, type: 'folder', parentId: null });

      const processHandle = async (handle, parentId) => {
        if (handle.kind === 'file') {
          const file = await handle.getFile();
          if (file.size > 2000000) return;
          const text = await file.text();
          let ext = file.name.split('.').pop();
          let lang = 'plaintext';
          if (ext === 'js' || ext === 'jsx') lang = 'javascript';
          if (ext === 'json') lang = 'json';
          if (ext === 'md') lang = 'markdown';
          if (ext === 'css') lang = 'css';
          if (ext === 'html') lang = 'html';

          newFiles.push({
            id: `file-${Math.random().toString(36).substr(2, 9)}`,
            name: handle.name, type: 'file', language: lang, parentId: parentId, content: text
          });
        } else if (handle.kind === 'directory') {
          if (handle.name === 'node_modules' || handle.name === '.git') return;
          const folderId = `folder-${Math.random().toString(36).substr(2, 9)}`;
          newFiles.push({ id: folderId, name: handle.name, type: 'folder', parentId: parentId });
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

  if (!activeFile) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e', color: '#cccccc' }}>
        <Code2 size={120} strokeWidth={1} color="#333" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 400, margin: '0 0 16px 0', color: '#fff' }}>No file open</h2>
        <p style={{ fontSize: '13px', color: '#888', maxWidth: '400px', textAlign: 'center', margin: '0 0 32px 0', lineHeight: 1.5 }}>
          Select a file from the Explorer sidebar, use <strong style={{ color: '#ccc', background: '#333', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+P</strong> to quick open, <br/> or open a folder from your system.
        </p>
        
        {can('editor.file.create') && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              style={blueBtnStyle}
              onClick={() => {
                const name = window.prompt("New File Name:");
                if (name) createFile(null, name, 'javascript');
              }}
            >
              Create File
            </button>
            <button onClick={handleOpenFolder} style={grayBtnStyle}>
              Open System Folder...
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <Editor
        height="100%"
        language={activeFile.language || 'javascript'}
        theme="vs-dark"
        value={activeFile.content}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly: !canEdit,
          minimap: { enabled: true },
          fontSize: 13,
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          formatOnPaste: true,
        }}
      />
    </div>
  );
}

const blueBtnStyle = {
  background: '#007acc', color: '#fff', border: 'none', borderRadius: '2px',
  padding: '6px 16px', fontSize: '13px', cursor: 'pointer', textAlign: 'center'
};

const grayBtnStyle = {
  background: '#333333', color: '#ccc', border: 'none', borderRadius: '2px',
  padding: '6px 16px', fontSize: '13px', cursor: 'pointer', textAlign: 'center'
};
