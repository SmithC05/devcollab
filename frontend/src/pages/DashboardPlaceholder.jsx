import { useAuthStore } from '../stores/authStore';
import ThemeToggle from '../components/ThemeToggle';
import { LogOut } from 'lucide-react';

const DashboardPlaceholder = () => {
  const { user, workspace, role, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">DevCollab</h1>
            {workspace && (
              <span className="px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-md border border-border">
                {workspace.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right mr-2">
              <div className="font-medium">{user?.name}</div>
              <div className="text-muted-foreground text-xs">{role?.toUpperCase()}</div>
            </div>
            <ThemeToggle />
            <button
              onClick={logout}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-card/50">
          <h2 className="text-2xl font-medium mb-2">Dashboard Placeholder</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            This is a temporary placeholder. The actual dashboard will be implemented by another developer in a future phase.
          </p>
        </div>
      </main>
    </div>
  );
};

export default DashboardPlaceholder;
