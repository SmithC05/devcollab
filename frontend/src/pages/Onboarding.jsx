import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { workspaceApi } from '../api/workspaceApi';
import ThemeToggle from '../components/ThemeToggle';
import { Loader2, Plus, Users } from 'lucide-react';
import { ROLES } from '../utils/constants';

const Onboarding = () => {
  const [activeTab, setActiveTab] = useState('create');
  
  // Create state
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  
  // Join state
  const [inviteCode, setInviteCode] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, setWorkspace, setRole } = useAuthStore();
  const navigate = useNavigate();

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!workspaceName.trim() || !workspaceSlug.trim()) {
      setError('Workspace name and slug are required.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await workspaceApi.createWorkspace(workspaceName, workspaceSlug, user.id);
      if (response.success) {
        setWorkspace(response.workspace);
        setRole(response.membership.role);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to create workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!inviteCode.trim()) {
      setError('Invite code is required.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await workspaceApi.joinWorkspace(inviteCode, user.id);
      if (response.success) {
        setWorkspace(response.workspace);
        setRole(response.membership.role); // Should be MEMBER
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to join workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Welcome to DevCollab</h1>
          <p className="text-muted-foreground">Set up your workspace to get started.</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => { setActiveTab('create'); setError(''); }}
              className={`flex-1 py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === 'create'
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus size={16} />
                Create Workspace
              </div>
            </button>
            <button
              onClick={() => { setActiveTab('join'); setError(''); }}
              className={`flex-1 py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === 'join'
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users size={16} />
                Join Existing Workspace
              </div>
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-3 text-sm border border-red-200 bg-red-50 text-red-600 rounded-md dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
                {error}
              </div>
            )}

            {activeTab === 'create' && (
              <form onSubmit={handleCreateWorkspace} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block" htmlFor="workspaceName">
                    Workspace Name
                  </label>
                  <input
                    id="workspaceName"
                    type="text"
                    value={workspaceName}
                    onChange={(e) => {
                      setWorkspaceName(e.target.value);
                      // Auto-generate a basic slug if the user hasn't typed one
                      if (!workspaceSlug || workspaceSlug === workspaceName.toLowerCase().replace(/\s+/g, '-').slice(0, -1)) {
                        setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                      }
                    }}
                    placeholder="My Development Team"
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block" htmlFor="workspaceSlug">
                    Workspace Slug
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                      devcollab.com/
                    </span>
                    <input
                      id="workspaceSlug"
                      type="text"
                      value={workspaceSlug}
                      onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="my-development-team"
                      className="flex-1 min-w-0 px-3 py-2 bg-input border border-border rounded-r-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-2 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Workspace
                </button>
              </form>
            )}

            {activeTab === 'join' && (
              <form onSubmit={handleJoinWorkspace} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block" htmlFor="inviteCode">
                    Invite / Workspace Code
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="DEVTEAM001"
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask your workspace admin for the invite code.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-2 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Join Workspace
                </button>
              </form>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center flex justify-center">
          <button 
            onClick={() => useAuthStore.getState().logout()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
