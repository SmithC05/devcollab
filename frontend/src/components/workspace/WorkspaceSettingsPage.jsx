import { useState, useEffect } from 'react';
import { Settings2, User, Bell, Palette, AlertTriangle, Save } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import PageContainer from '../layout/PageContainer';
import { Card, Button, Spinner, Input } from '../ui/index';

export default function WorkspaceSettingsPage() {
  const [activeTab, setActiveTab] = useState('Workspace');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ name: '', slug: '', description: '' });
  const [error, setError] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();

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
        body: JSON.stringify(data),
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
    { id: 'Danger Zone', icon: AlertTriangle },
  ];

  if (loading) return <div className="flex justify-center py-32"><Spinner size={22} /></div>;
  if (error) return <div className="text-center py-32 text-red-400 text-sm">{error}</div>;

  const labelClass = 'block text-[13px] font-medium text-[var(--text-secondary)] mb-2';
  const userName = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username || 'User';
  const userEmail = user?.email || 'user@example.com';

  return (
    <PageContainer className="w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10 pt-12 md:pt-14">
      <div className="mb-8">
        <h1 className="text-[40px] md:text-[44px] font-semibold text-[var(--text-primary)] mb-3 leading-tight">
          Settings
        </h1>
        <p className="text-[16px] text-[var(--text-secondary)] max-w-3xl leading-relaxed">
          Manage your workspace and personal preferences.
        </p>
      </div>

      <div className="mb-10 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
        <div className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-10 px-4 rounded-md flex items-center gap-2.5 text-[14px] font-semibold transition-colors ${
                activeTab === tab.id
                  ? tab.id === 'Danger Zone'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                    : 'bg-[var(--border-strong)] text-[var(--text-primary)]'
                  : tab.id === 'Danger Zone'
                    ? 'text-red-400/80 hover:text-red-400 hover:bg-red-500/5'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <tab.icon size={15} />
              {tab.id}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl">
        {activeTab === 'Workspace' && (
          <Card className="p-10 rounded-lg min-h-[520px]">
            <div className="mb-10">
              <h2 className="text-[22px] font-semibold text-[var(--fg)] mb-2">Workspace Details</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                Manage your workspace preferences and identity.
              </p>
            </div>
            <form onSubmit={handleSaveWorkspace} className="space-y-10">
              <div>
                <label className={labelClass}>Workspace Name</label>
                <Input
                  type="text"
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="h-11 text-[14px] px-4"
                />
              </div>
              <div>
                <label className={labelClass}>Workspace Slug</label>
                <div className="flex items-center">
                  <span className="bg-[var(--surface-item)] border border-r-0 border-[var(--border-strong)] rounded-l-md px-4 h-11 flex items-center text-[14px] text-[var(--text-muted)] whitespace-nowrap">
                    devcollab.com/
                  </span>
                  <Input
                    type="text"
                    value={data.slug || ''}
                    onChange={(e) => setData({ ...data, slug: e.target.value })}
                    className="rounded-l-none h-11 text-[14px] px-4"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows={4}
                  value={data.description || ''}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  className="w-full min-h-[132px] bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-md px-4 py-3 text-[14px] leading-relaxed text-[var(--fg)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] transition-colors outline-none resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" disabled={saving} icon={Save} iconSize={15} className="h-11 px-5 text-[14px]">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === 'Profile' && (
          <Card className="p-10 rounded-lg min-h-[520px]">
            <div className="mb-10">
              <h2 className="text-[22px] font-semibold text-[var(--fg)] mb-2">Profile</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                Manage your personal developer profile and public identity.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
              <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] p-6 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-[#8B6B5D] text-white flex items-center justify-center text-[28px] font-semibold mb-4">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <p className="text-[16px] font-semibold text-[var(--fg)] mb-1">{userName}</p>
                <p className="text-[13px] text-[var(--text-muted)] break-all">{userEmail}</p>
                <Button variant="secondary" className="mt-6 h-10 px-4 text-[13px]">
                  Change Avatar
                </Button>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  <div>
                    <label className={labelClass}>Display Name</label>
                    <Input defaultValue={userName} className="h-11 text-[14px] px-4" />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <Input defaultValue={userEmail} className="h-11 text-[14px] px-4" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>GitHub Profile</label>
                  <Input placeholder="https://github.com/username" className="h-11 text-[14px] px-4" />
                </div>
                <div>
                  <label className={labelClass}>Bio</label>
                  <textarea
                    rows={4}
                    placeholder="Write a short developer bio..."
                    className="w-full min-h-[132px] bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-md px-4 py-3 text-[14px] leading-relaxed text-[var(--fg)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] transition-colors outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="primary" icon={Save} iconSize={15} className="h-11 px-5 text-[14px]">
                    Save Profile
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'Notifications' && (
          <Card className="p-8 rounded-lg max-w-[880px]">
            <div className="mb-8">
              <h2 className="text-[22px] font-semibold text-[var(--fg)] mb-2">Notifications</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                Control what you get notified about.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Task assignments', desc: 'Notify me when work is assigned or reassigned.' },
                { title: '@mentions', desc: 'Notify me when teammates mention me directly.' },
                { title: 'Comments', desc: 'Notify me about replies and discussion updates.' },
                { title: 'Project activity', desc: 'Send updates for important project changes.' },
              ].map((notif, index) => (
                <div key={index} className="flex items-center justify-between gap-6 p-4 bg-[var(--surface-item)] border border-[var(--border-subtle)] rounded-lg">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[var(--fg)] mb-1">{notif.title}</p>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{notif.desc}</p>
                  </div>
                  <div className="w-10 h-5 bg-blue-500 rounded-full relative cursor-pointer border border-[var(--accent-border)] shrink-0">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'Appearance' && (
          <Card className="p-8 rounded-lg max-w-[980px]">
            <div className="mb-8">
              <h2 className="text-[22px] font-semibold text-[var(--fg)] mb-2">Appearance</h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                Customize how DevCollab looks on this device.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['light', 'dark'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => theme !== mode && toggleTheme()}
                  className={`p-5 border rounded-lg text-left transition-colors ${
                    theme === mode
                      ? 'border-[var(--text-primary)] bg-[var(--surface-item)]'
                      : 'border-[var(--border-strong)] bg-transparent hover:border-[var(--border-focus)]'
                  }`}
                >
                  <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] mb-5 overflow-hidden">
                    <div className={`h-8 border-b border-[var(--border-strong)] ${mode === 'light' ? 'bg-[#F8FAFC]' : 'bg-[#191919]'}`} />
                    <div className="p-4">
                      <div className={`h-4 rounded mb-3 ${mode === 'light' ? 'bg-[#DADDE3]' : 'bg-[#2F2F2F]'}`} />
                      <div className={`h-4 rounded w-2/3 mb-3 ${mode === 'light' ? 'bg-[#C9CED8]' : 'bg-[#3A3A3A]'}`} />
                      <div className={`h-4 rounded w-1/2 ${mode === 'light' ? 'bg-[#B9C0CC]' : 'bg-[#454545]'}`} />
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`font-semibold text-[17px] mb-2 ${theme === mode ? 'text-[var(--text-primary)]' : 'text-[var(--fg)]'}`}>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </p>
                      <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">
                        {mode === 'light' ? 'Classic bright interface.' : 'Professional dark mode.'}
                      </p>
                    </div>
                    {theme === mode && (
                      <span className="shrink-0 rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)]">
                        Active
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'Danger Zone' && (
          <Card className="p-8 rounded-lg max-w-[780px] border-red-500/30">
            <div className="mb-7">
              <h2 className="text-[22px] font-semibold text-red-500 mb-2 flex items-center gap-2">
                <AlertTriangle size={19} /> Danger Zone
              </h2>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                Destructive actions for this workspace.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Leave Workspace', desc: 'Revoke your access to this workspace.', label: 'Leave', variant: 'secondary' },
                { title: 'Delete Workspace', desc: 'Permanently delete this workspace and all data.', label: 'Delete', variant: 'danger' },
              ].map(({ title, desc, label, variant }, index) => (
                <div key={index} className="p-5 bg-red-500/5 border border-red-500/20 rounded-lg grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[var(--fg)] mb-1">{title}</p>
                    <p className="text-[13px] text-red-400/80 leading-relaxed">{desc}</p>
                  </div>
                  <Button variant={variant} size="sm" className="h-9 min-w-[84px] px-4 text-[12px] justify-center shrink-0 justify-self-start sm:justify-self-end">
                    {label}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
