import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Trash2, Archive, Save } from 'lucide-react';

export default function ProjectSettingsPage() {
  const { can } = useAuthStore();

  const canDelete = can('project.delete');
  const canArchive = can('project.settings');
  const canRename = can('project.settings');

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Project Settings</h1>
        <p className="text-gray-400">Manage your project configuration and danger zones.</p>
      </div>

      {/* General Settings */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-[#2a2a2e] pb-2">General</h2>
        
        <div className="bg-[#111113] p-6 rounded-lg border border-[#2a2a2e] space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
            <input 
              type="text" 
              defaultValue="Alpha Release"
              disabled={!canRename}
              className="w-full bg-[#18181c] border border-[#2a2a2e] rounded px-4 py-2 text-white focus:outline-none focus:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea 
              rows={3}
              defaultValue="Core platform modernization phase 1."
              disabled={!canRename}
              className="w-full bg-[#18181c] border border-[#2a2a2e] rounded px-4 py-2 text-white focus:outline-none focus:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {canRename && (
            <div className="flex justify-end">
              <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
                <Save size={16} /> Save Changes
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      {(canArchive || canDelete) && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-500 border-b border-red-900/50 pb-2">Danger Zone</h2>
          
          <div className="bg-[#1a0f0f] p-6 rounded-lg border border-red-900/50 space-y-6">
            
            {canArchive && (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Archive Project</h3>
                  <p className="text-sm text-gray-400">Mark this project as read-only and hide it from active dashboards.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-yellow-700/50 text-yellow-500 hover:bg-yellow-950/30 rounded-md transition-colors">
                  <Archive size={16} /> Archive
                </button>
              </div>
            )}

            {canArchive && canDelete && <div className="border-t border-red-900/30"></div>}

            {canDelete && (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Delete Project</h3>
                  <p className="text-sm text-gray-400">Permanently delete this project and all of its data. This cannot be undone.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/30 text-red-500 hover:bg-red-600/20 rounded-md transition-colors">
                  <Trash2 size={16} /> Delete Project
                </button>
              </div>
            )}

          </div>
        </section>
      )}

    </div>
  );
}
