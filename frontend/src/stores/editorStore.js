import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SAMPLE_FILES = [
  { id: 'f-root', name: 'devcollab', type: 'folder', parentId: null },
  { id: 'f-backend', name: 'backend', type: 'folder', parentId: 'f-root' },
  { id: 'f-frontend', name: 'frontend', type: 'folder', parentId: 'f-root' },
  { id: 'f-apps', name: 'apps', type: 'folder', parentId: 'f-backend' },
  { id: 'file-1', name: 'models.py', type: 'file', language: 'python', parentId: 'f-apps', content: 'from django.db import models\n\nclass Project(models.Model):\n    name = models.CharField(max_length=255)\n    created_at = models.DateTimeField(auto_now_add=True)\n' },
  { id: 'file-2', name: 'views.py', type: 'file', language: 'python', parentId: 'f-apps', content: 'from rest_framework import viewsets\nfrom .models import Project\nfrom .serializers import ProjectSerializer\n\nclass ProjectViewSet(viewsets.ModelViewSet):\n    queryset = Project.objects.all()\n    serializer_class = ProjectSerializer\n' },
  { id: 'f-src', name: 'src', type: 'folder', parentId: 'f-frontend' },
  { id: 'f-components', name: 'components', type: 'folder', parentId: 'f-src' },
  { id: 'file-3', name: 'App.jsx', type: 'file', language: 'javascript', parentId: 'f-src', content: 'import React from "react";\nimport { RouterProvider } from "react-router-dom";\nimport router from "./router";\n\nexport default function App() {\n  return <RouterProvider router={router} />;\n}\n' },
  { id: 'file-4', name: 'package.json', type: 'file', language: 'json', parentId: 'f-frontend', content: '{\n  "name": "devcollab-frontend",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "zustand": "^4.5.0"\n  }\n}\n' },
];

export const useEditorStore = create(
  persist(
    (set, get) => ({
      files: SAMPLE_FILES,
      openTabs: [],
      activeFileId: null,
      expandedFolders: ['src', 'components'],
      dirtyFiles: [], // Array of file IDs that have unsaved changes

      // Open a file as a tab
      openFile: (fileId) => {
        const { openTabs, files } = get();
        const file = files.find(f => f.id === fileId);
        if (!file || file.type !== 'file') return;
        
        if (!openTabs.includes(fileId)) {
          set({ openTabs: [...openTabs, fileId], activeFileId: fileId });
        } else {
          set({ activeFileId: fileId });
        }
      },

      // Close a tab
      closeTab: (fileId) => {
        const { openTabs, activeFileId, dirtyFiles } = get();
        const newTabs = openTabs.filter(id => id !== fileId);
        let newActiveId = activeFileId;
        
        if (activeFileId === fileId) {
          newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
        }
        
        set({ 
          openTabs: newTabs, 
          activeFileId: newActiveId,
          // Revert dirty state if closed without saving (for this simple frontend model)
          dirtyFiles: dirtyFiles.filter(id => id !== fileId) 
        });
      },

      setActiveFile: (fileId) => set({ activeFileId: fileId }),

      // Update content as user types (debounced typically by the caller)
      updateFileContent: (fileId, content) => {
        set((state) => ({
          files: state.files.map((f) => f.id === fileId ? { ...f, content } : f),
          dirtyFiles: state.dirtyFiles.includes(fileId) ? state.dirtyFiles : [...state.dirtyFiles, fileId]
        }));
      },

      // Simulate save (clear from dirtyFiles)
      saveFile: (fileId) => {
        set((state) => ({
          dirtyFiles: state.dirtyFiles.filter((id) => id !== fileId)
        }));
      },

      toggleFolder: (folderId) => {
        set((state) => ({
          expandedFolders: state.expandedFolders.includes(folderId)
            ? state.expandedFolders.filter(id => id !== folderId)
            : [...state.expandedFolders, folderId]
        }));
      },

      createFile: (parentId, name, language) => {
        const newFile = {
          id: `file-${Date.now()}`,
          name,
          type: 'file',
          language,
          parentId,
          content: ''
        };
        set((state) => ({ files: [...state.files, newFile] }));
      },

      createFolder: (parentId, name) => {
        const newFolder = {
          id: `folder-${Date.now()}`,
          name,
          type: 'folder',
          parentId
        };
        set((state) => ({ files: [...state.files, newFolder] }));
      },

      renameFile: (fileId, newName) => {
        set((state) => ({
          files: state.files.map((f) => f.id === fileId ? { ...f, name: newName } : f)
        }));
      },

      deleteFile: (fileId) => {
        // Also clean up tabs and expanded folders if deleted
        set((state) => {
          const filesToDelete = new Set();
          
          const collectFiles = (id) => {
            filesToDelete.add(id);
            state.files.filter(f => f.parentId === id).forEach(child => collectFiles(child.id));
          };
          collectFiles(fileId);

          return {
            files: state.files.filter(f => !filesToDelete.has(f.id)),
            openTabs: state.openTabs.filter(id => !filesToDelete.has(id)),
            activeFileId: filesToDelete.has(state.activeFileId) 
              ? (state.openTabs.find(id => !filesToDelete.has(id)) || null) 
              : state.activeFileId,
            dirtyFiles: state.dirtyFiles.filter(id => !filesToDelete.has(id))
          };
        });
      },

      loadWorkspace: (newFiles) => {
        set({
          files: newFiles,
          openTabs: [],
          activeFileId: null,
          expandedFolders: newFiles.filter(f => f.parentId === null).map(f => f.id),
          dirtyFiles: []
        });
      },
    }),
    {
      name: 'devcollab_editor', // Zustand local storage persistence
      version: 1, // bump version to clear previous mock cache
    }
  )
);
