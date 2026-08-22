import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import PageContainer from '../layout/PageContainer';
import { Card, CardContent, Button, Spinner, Progress, SectionHeader, Badge } from '../ui/index';

export default function WorkspaceBillingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const response = await fetch('/api/workspace/billing/');
        if (!response.ok) throw new Error('Failed to load billing data');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, []);

  const handleUpgrade = () => {
    setUpgrading(true);
    setTimeout(() => {
      alert('Payment integration is currently under development (Razorpay Sandbox mode pending).');
      setUpgrading(false);
    }, 1000);
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size={22} /></div>;
  if (error) return <div className="text-center py-32 text-red-400 text-sm">{error}</div>;

  const { plan = 'FREE', usage = {} } = data || {};
  const { projects = 0, projects_limit = 3, members = 0, members_limit = 5 } = usage;

  return (
    <PageContainer>
      <SectionHeader 
        title="Billing & Plans"
        description="Manage your subscription and plan limits."
      />

      {/* Current Plan Banner */}
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 border border-[var(--accent-border)] shrink-0">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">Current Plan</p>
              <div className="flex items-center gap-3">
                <h2 className="text-[24px] font-semibold text-[var(--fg)] leading-none">{plan}</h2>
                <Badge variant="default">ACTIVE</Badge>
              </div>
            </div>
          </div>
          {plan === 'FREE' && (
            <Button variant="primary" onClick={handleUpgrade} disabled={upgrading}>
              {upgrading && <Loader2 size={14} className="animate-spin" />}
              Upgrade to Pro
            </Button>
          )}
        </div>
      </Card>

      {/* Usage */}
      <div className="mb-8">
        <h3 className="text-[15px] font-semibold text-[var(--fg)] mb-4">Workspace Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Projects', used: projects, limit: projects_limit },
            { label: 'Members', used: members, limit: members_limit },
          ].map(({ label, used, limit }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[14px] font-medium text-[var(--fg)]">{label}</p>
                  <p className="text-[13px] text-[var(--text-muted)]">
                    <span className="text-[var(--fg)] font-medium">{used}</span> / {limit}
                  </p>
                </div>
                <Progress
                  value={used}
                  max={limit}
                  colorClass={used >= limit ? 'bg-red-500' : 'bg-blue-500'}
                />
                {used >= limit && (
                  <p className="text-[12px] text-red-400 mt-2 flex items-center gap-1.5 font-medium">
                    <AlertCircle size={13} /> Limit reached — upgrade to add more
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Plan Comparison */}
      <div>
        <h3 className="text-[15px] font-semibold text-[var(--fg)] mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Starter / Free */}
          <Card className="p-8 relative overflow-hidden">
            <h4 className="text-[18px] font-semibold text-[var(--fg)] mb-2">Starter</h4>
            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-[32px] font-bold text-[var(--fg)] leading-none">$0</span>
              <span className="text-[14px] text-[var(--text-muted)]">/ month</span>
            </div>
            <ul className="space-y-3.5 mb-8">
              {['1 workspace', 'Up to 3 projects', 'Up to 5 members', 'Core collaboration features', 'No AI features'].map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-[var(--text-secondary)]">
                  <CheckCircle2 size={16} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="secondary" className="w-full justify-center pointer-events-none">
              Current Plan
            </Button>
          </Card>

          {/* Pro */}
          <Card className="p-8 flex flex-col border-[var(--border-focus)] relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge variant="blue">RECOMMENDED</Badge>
            </div>
            <h4 className="text-[18px] font-semibold text-[var(--fg)] mb-2">Pro</h4>
            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-[32px] font-bold text-[var(--fg)] leading-none">Contact</span>
              <span className="text-[14px] text-[var(--text-muted)]">/ Upgrade</span>
            </div>
            <ul className="space-y-3.5 mb-8 flex-1">
              {['Unlimited workspaces', 'Unlimited projects', 'Unlimited members', 'AI Assistant', 'AI Code Reviewer', 'Project Summariser', 'Standup Generator', 'Task Breakdown'].map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-[var(--text-secondary)]">
                  <CheckCircle2 size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="primary" className="w-full justify-center" onClick={handleUpgrade} disabled={upgrading}>
              {upgrading && <Loader2 size={14} className="animate-spin" />}
              Upgrade to Pro
            </Button>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
