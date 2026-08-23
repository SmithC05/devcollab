import { useState, useEffect } from 'react';
import { Settings2, User, Bell, Palette, AlertTriangle, Save } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import PageContainer from '../layout/PageContainer';
import { Card, Button, Spinner, Input, SectionHeader, Tabs, Tab } from '../ui/index';
import DeveloperProfileSettings from './DeveloperProfileSettings';

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

  if (loading) return <div className="flex justify-center py-32"><Spinner size={22} /></div>;
  if (error) return <div className="text-center py-32 text-red-400 text-sm">{error}</div>;

  const labelClass = 'block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5';

  return (
    <PageContainer>
      <SectionHeader 
        title="Settings"
        description="Manage your workspace and personal preferences."
      />

      {/* Navigation Tabs */}
      <div className="mb-8 overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
        <Tabs className="w-fit">
          {tabs.map(tab => (
            <Tab 
              key={tab.id} 
              active={activeTab === tab.id} 
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="flex items-center gap-2">
                <tab.icon size={13} className={tab.id === 'Danger Zone' && activeTab === tab.id ? 'text-red-400' : ''} />
                <span className={tab.id === 'Danger Zone' && activeTab === tab.id ? 'text-red-400' : ''}>{tab.id}</span>
              </span>
            </Tab>
          ))}
        </Tabs>
      </div>

      {/* Settings Content */}
      <div className="max-w-2xl">
        {activeTab === 'Workspace' && (
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-[16px] font-semibold text-[var(--fg)] mb-1">Workspace Details</h2>
              <p className="text-[13px] text-[var(--text-secondary)]">Manage your workspace preferences and identity.</p>
            </div>
            <form onSubmit={handleSaveWorkspace} className="space-y-5">
              <div>
                <label className={labelClass}>Workspace Name</label>
                <Input
                  type="text"
                  value={data.name || ''}
                  onChange={e => setData({ ...data, name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Workspace Slug</label>
                <div className="flex items-center">
                  <span className="bg-[var(--surface-item)] border border-r-0 border-[var(--border-strong)] rounded-l-md px-3 h-[36px] flex items-center text-[13px] text-[var(--text-muted)] whitespace-nowrap">
                    devcollab.com/
                  </span>
                  <Input
                    type="text"
                    value={data.slug || ''}
                    onChange={e => setData({ ...data, slug: e.target.value })}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows={4}
                  value={data.description || ''}
                  onChange={e => setData({ ...data, description: e.target.value })}
                  className="w-full bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-[13px] text-[var(--fg)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] transition-colors outline-none resize-none"
                />
              </div>
              <div className="pt-5 flex justify-end">
                <Button type="submit" variant="primary" disabled={saving} icon={Save} iconSize={14}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === 'Profile' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-[16px] font-semibold text-[var(--fg)] mb-1">Profile</h2>
                <p className="text-[13px] text-[var(--text-secondary)]">Manage your personal developer profile.</p>
              </div>
              <div className="py-12 border border-dashed border-[var(--border-strong)] rounded-xl text-center text-[var(--text-muted)] text-[13px]">
                Profile fields (Avatar, Bio) — backend schema update pending.
              </div>
            </Card>
            
            <DeveloperProfileSettings />
          </div>
        )}

        {activeTab === 'Appearance' && (
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-[16px] font-semibold text-[var(--fg)] mb-1">Appearance</h2>
              <p className="text-[13px] text-[var(--text-secondary)]">Customize how DevCollab looks on this device.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['light', 'dark'].map(mode => (
                <button
                  key={mode}
                  onClick={() => theme !== mode && toggleTheme()}
                  className={`p-5 border rounded-xl text-left transition-colors ${
                    theme === mode
                      ? 'border-[var(--text-primary)] bg-[var(--surface-item)]'
                      : 'border-[var(--border-strong)] bg-transparent hover:border-[var(--border-focus)]'
                  }`}
                >
                  <p className={`font-medium text-[14px] ${theme === mode ? 'text-[var(--text-primary)]' : 'text-[var(--fg)]'}`}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </p>
                  <p className="text-[12px] mt-1.5 text-[var(--text-muted)]">
                    {mode === 'light' ? 'Classic bright interface.' : 'Professional dark mode.'}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'Notifications' && (
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-[16px] font-semibold text-[var(--fg)] mb-1">Notifications</h2>
              <p className="text-[13px] text-[var(--text-secondary)]">Control what you get notified about.</p>
            </div>
            <div className="space-y-3">
              {['Task assignments', '@mentions', 'Comments', 'Project activity'].map((notif, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[var(--surface-item)] border border-[var(--border-subtle)] rounded-lg">
                  <span className="text-[13px] text-[var(--fg)]">{notif}</span>
                  <div className="w-8 h-4 bg-blue-500 rounded-full relative cursor-pointer border border-[var(--accent-border)]">
                    <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'Danger Zone' && (
          <Card className="p-6 border-red-500/30">
            <div className="mb-6">
              <h2 className="text-[16px] font-semibold text-red-500 mb-1 flex items-center gap-2">
                <AlertTriangle size={16} /> Danger Zone
              </h2>
              <p className="text-[13px] text-[var(--text-secondary)]">Destructive actions for this workspace.</p>
            </div>
            <div className="border border-red-500/20 rounded-xl overflow-hidden">
              {[
                { title: 'Leave Workspace', desc: 'Revoke your access to this workspace.', label: 'Leave', variant: 'secondary' },
                { title: 'Delete Workspace', desc: 'Permanently delete this workspace and all data.', label: 'Delete', variant: 'danger' }
              ].map(({ title, desc, label, variant }, i) => (
                <div
                  key={i}
                  className="p-5 bg-red-500/5 flex items-center justify-between gap-4"
                  style={i > 0 ? { borderTop: '1px solid rgba(239,68,68,0.15)' } : {}}
                >
                  <div>
                    <p className="text-[13px] font-medium text-[var(--fg)] mb-0.5">{title}</p>
                    <p className="text-[12px] text-red-400/80">{desc}</p>
                  </div>
                  <Button variant={variant} size="sm" className="shrink-0">{label}</Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
