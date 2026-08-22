import { useState, useEffect } from 'react';
import { Loader2, Settings2, User, Bell, Palette, AlertTriangle, Save } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import PageContainer from '../../components/layout/PageContainer';

export default function WorkspaceSettingsPage() {
  const [activeTab, setActiveTab] = useState('Workspace');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ name: '', slug: '', description: '' });
  const [error, setError] = useState(null);
  
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/workspace/settings/');
        if (!response.ok) throw new Error('Failed to load settings');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/workspace/settings/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'Workspace', icon: Settings2 },
    { id: 'Profile', icon: User },
    { id: 'Notifications', icon: Bell },
    { id: 'Appearance', icon: Palette },
    { id: 'Danger Zone', icon: AlertTriangle }
  ];

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-[#666]" size={24} /></div>;
  if (error) return <div className="text-center py-32 text-red-400 text-sm">{error}</div>;

  return (
    <PageContainer className="flex gap-10">
      {/* Settings Navigation */}
      <div className="w-[220px] shrink-0">
        <h2 className="text-[13px] font-medium text-[#777] uppercase tracking-wider mb-4 px-3">Settings</h2>
        <nav className="flex flex-col gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors ${
                activeTab === tab.id 
                  ? tab.id === 'Danger Zone' ? 'bg-red-500/10 text-red-400' : 'bg-[#2A2A2A] text-gray-100 font-medium'
                  : tab.id === 'Danger Zone' ? 'text-red-400/70 hover:bg-red-500/10 hover:text-red-400' : 'text-[#888] hover:bg-[#161616] hover:text-gray-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.id}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 max-w-2xl">
        {activeTab === 'Workspace' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-100 mb-1">Workspace Settings</h1>
              <p className="text-[13px] text-[#888]">Manage your workspace preferences and details.</p>
            </div>
            <form onSubmit={handleSaveWorkspace} className="space-y-6">
              <div>
                <label className="block text-[13px] font-medium text-gray-300 mb-2">Workspace Name</label>
                <input 
                  type="text" 
                  value={data.name || ''} 
                  onChange={e => setData({...data, name: e.target.value})}
                  className="w-full bg-[#161616] border border-[#2A2A2A] rounded-md px-4 py-2 text-[14px] text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-300 mb-2">Workspace Slug</label>
                <div className="flex items-center">
                  <span className="bg-[#111] border border-r-0 border-[#2A2A2A] rounded-l-md px-4 py-2 text-[14px] text-[#777]">devcollab.com/</span>
                  <input 
                    type="text" 
                    value={data.slug || ''} 
                    onChange={e => setData({...data, slug: e.target.value})}
                    className="w-full bg-[#161616] border border-[#2A2A2A] rounded-r-md px-4 py-2 text-[14px] text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-300 mb-2">Description</label>
                <textarea 
                  rows={4}
                  value={data.description || ''} 
                  onChange={e => setData({...data, description: e.target.value})}
                  className="w-full bg-[#161616] border border-[#2A2A2A] rounded-md px-4 py-2 text-[14px] text-gray-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
              <div className="pt-4 border-t border-[#2A2A2A] flex justify-end">
                <button type="submit" disabled={saving} className="h-[36px] px-6 bg-white text-black font-medium text-[13px] rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'Profile' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-100 mb-1">Profile</h1>
              <p className="text-[13px] text-[#888]">Manage your personal developer profile.</p>
            </div>
            <div className="p-8 border border-dashed border-[#2A2A2A] rounded-lg text-center text-[#777] text-[13px]">
              Profile fields (Avatar, Bio, GitHub link) integration pending backend schema update.
            </div>
          </div>
        )}

        {activeTab === 'Appearance' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-100 mb-1">Appearance</h1>
              <p className="text-[13px] text-[#888]">Customize how DevCollab looks on this device.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`p-4 border rounded-lg text-left transition-colors ${theme === 'light' ? 'border-blue-500 bg-blue-50/50' : 'border-[#2A2A2A] bg-[#161616] hover:border-[#444]'}`}
              >
                <p className={`font-medium ${theme === 'light' ? 'text-blue-900' : 'text-gray-200'}`}>Light</p>
                <p className={`text-[12px] mt-1 ${theme === 'light' ? 'text-blue-700' : 'text-[#777]'}`}>Classic bright interface.</p>
              </button>
              <button 
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`p-4 border rounded-lg text-left transition-colors ${theme === 'dark' ? 'border-blue-500 bg-blue-500/5' : 'border-[#2A2A2A] bg-[#161616] hover:border-[#444]'}`}
              >
                <p className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-gray-200'}`}>Dark</p>
                <p className={`text-[12px] mt-1 ${theme === 'dark' ? 'text-blue-400/70' : 'text-[#777]'}`}>DevCollab professional dark mode.</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Notifications' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-100 mb-1">Notifications</h1>
              <p className="text-[13px] text-[#888]">Control what you get notified about.</p>
            </div>
            <div className="space-y-4">
              {['Task assignments', '@mentions', 'Comments', 'Project activity'].map((notif, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#161616] border border-[#2A2A2A] rounded-md">
                  <span className="text-[14px] text-gray-200">{notif}</span>
                  <div className="w-8 h-4 bg-blue-500 rounded-full relative cursor-pointer">
                    <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Danger Zone' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-red-500 mb-1">Danger Zone</h1>
              <p className="text-[13px] text-[#888]">Destructive actions for this workspace.</p>
            </div>
            <div className="border border-red-500/20 rounded-lg overflow-hidden">
              <div className="p-5 border-b border-red-500/20 bg-red-500/5 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-gray-200 mb-1">Leave Workspace</p>
                  <p className="text-[12px] text-[#888]">Revoke your access to this workspace.</p>
                </div>
                <button className="h-[32px] px-4 bg-[#161616] border border-red-500/30 text-red-400 font-medium text-[12px] rounded hover:bg-red-500 hover:text-white transition-colors">
                  Leave
                </button>
              </div>
              <div className="p-5 bg-red-500/5 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-gray-200 mb-1">Delete Workspace</p>
                  <p className="text-[12px] text-[#888]">Permanently delete this workspace and all its data.</p>
                </div>
                <button className="h-[32px] px-4 bg-red-500 text-white font-medium text-[12px] rounded hover:bg-red-600 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
