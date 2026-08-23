import { useState, useEffect } from 'react';
import { Settings2, User, Bell, Palette, AlertTriangle, Save } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import PageContainer from '../layout/PageContainer';
import { Card, Button, Spinner, Input, SectionHeader, Tabs, Tab } from '../ui/index';
import DeveloperProfileSettings from './DeveloperProfileSettings';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../api/client';

export default function WorkspaceSettingsPage() {
  const { activeWorkspace } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Workspace');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [data, setData] = useState({ name: '', slug: '', description: '' });
  const [profileData, setProfileData] = useState({ name: '', email: '', bio: '', github_url: '', avatar_url: '' });
  const [error, setError] = useState(null);
  const { theme, toggleTheme } = useTheme();
  
  const { user, updateUser } = useAuthStore();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiClient('/workspace/settings/');
        setData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Initialize profile data from global store when it loads or changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || user.first_name || '',
        email: user.email || '',
        bio: user.bio || '',
        github_url: user.github_url || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // apiClient automatically attaches the JWT Authorization header
      await apiClient('/workspace/settings/', {
        method: 'PUT',
        body: JSON.stringify({ name: data.name, slug: data.slug, description: data.description }),
      });
    } catch (err) {
      setError(err.message || 'Failed to save workspace settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { authApi } = await import('../../api/authApi');
      
      let payload;
      if (profileData.avatar_file) {
        payload = new FormData();
        payload.append('name', profileData.name);
        payload.append('bio', profileData.bio);
        payload.append('github_url', profileData.github_url);
        payload.append('avatar_file', profileData.avatar_file);
      } else {
        payload = {
          name: profileData.name,
          bio: profileData.bio,
          github_url: profileData.github_url,
          avatar_url: profileData.avatar_url
        };
      }
      
      const res = await authApi.updateProfile(payload);
      if (!res.success) throw new Error(res.error || 'Failed to update profile');
      updateUser(res.user);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingProfile(false);
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
              
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-5 pb-5 border-b border-[var(--border-subtle)]">
                  <div className="w-[60px] h-[60px] rounded-full bg-[var(--surface-item)] border border-[var(--border-strong)] flex items-center justify-center overflow-hidden shrink-0">
                    {profileData.avatar_url ? (
                      <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[20px] font-medium text-[var(--text-secondary)]">
                        {(profileData.name || 'User').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[14px] font-medium text-[var(--fg)]">{profileData.name || 'User'}</span>
                    <span className="text-[13px] text-[var(--text-muted)]">{profileData.email}</span>
                    <div className="flex gap-3 mt-1">
                      <button 
                        type="button" 
                        onClick={() => document.getElementById('avatar-upload').click()}
                        className="text-[12px] font-medium text-[var(--text-primary)] hover:underline"
                      >
                        Change Avatar
                      </button>
                      {profileData.avatar_url && (
                        <button type="button" onClick={() => setProfileData({ ...profileData, avatar_url: '', avatar_file: null })} className="text-[12px] font-medium text-red-400 hover:underline">Remove</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const tempUrl = URL.createObjectURL(file);
                      setProfileData({ ...profileData, avatar_url: tempUrl, avatar_file: file });
                    }
                  }}
                />

                <div>
                  <label className={labelClass}>Full Name</label>
                  <Input
                    type="text"
                    required
                    value={profileData.name || ''}
                    onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <Input
                    type="email"
                    value={profileData.email || ''}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">Email address is managed by your authentication provider.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-medium text-[var(--text-secondary)]">Bio</label>
                    <span className="text-[11px] text-[var(--text-muted)]">{(profileData.bio || '').length} / 500</span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={500}
                    placeholder="Tell your team a little about yourself..."
                    value={profileData.bio || ''}
                    onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-[13px] text-[var(--fg)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] transition-colors outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" disabled={savingProfile} icon={Save} iconSize={14}>
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
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
