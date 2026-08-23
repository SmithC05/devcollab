import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import PageContainer from '../layout/PageContainer';
import { Card, CardContent, Button, Spinner, Progress, Badge } from '../ui/index';
import { useAuthStore } from '../../stores/authStore';

export default function WorkspaceBillingPage() {
  const { activeWorkspace } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const { workspacePlan, upgradeWorkspaceToPro, downgradeWorkspaceToFree } = useAuthStore();

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const response = await apiClient('/workspace/billing/');
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [activeWorkspace?.id]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    setError(null);
    try {
      const res = await loadRazorpay();
      if (!res) throw new Error('Razorpay SDK failed to load');

      const orderRes = await fetch('/api/workspace/billing/create-order/', { method: 'POST' });
      if (!orderRes.ok) throw new Error('Failed to create order');
      const orderData = await orderRes.json();
      if (orderData.error) throw new Error(orderData.error);

      const options = {
        key: orderData.key_id,
        name: 'DevCollab',
        description: 'Upgrade to Pro Plan',
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/workspace/billing/verify-payment/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            
            upgradeWorkspaceToPro();
            setData((current) => ({
              ...current,
              plan: 'PRO',
              usage: {
                ...(current?.usage || {}),
                projects_limit: 999,
                members_limit: 999,
              },
            }));
          } catch (err) {
            setError(err.message);
          } finally {
            setUpgrading(false);
          }
        },
        theme: {
          color: '#D4AF37'
        },
        modal: {
          ondismiss: function() {
            setError("Payment was cancelled. You can try again when you're ready.");
            setUpgrading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(response.error.description);
        setUpgrading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
      setUpgrading(false);
    }
  };

  const handlePreviousPlan = () => {
    downgradeWorkspaceToFree();
    setData((current) => ({
      ...current,
      plan: 'FREE',
      usage: {
        ...(current?.usage || {}),
        projects_limit: 3,
        members_limit: 5,
      },
    }));
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size={22} /></div>;

  const { plan: serverPlan = 'FREE', usage = {} } = data || {};
  const plan = workspacePlan === 'PRO' ? 'PRO' : serverPlan;
  const isPro = plan === 'PRO';
  const { projects = 0, projects_limit = 3, members = 0, members_limit = 5 } = usage;

  return (
    <PageContainer className="w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10 pt-12 md:pt-14">
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-400 text-sm font-medium">
            <AlertCircle size={16} />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      )}
      <div className="mb-10">
        <h1 className="text-[40px] md:text-[44px] font-semibold text-[var(--text-primary)] mb-3 leading-tight">
          Billing & Plans
        </h1>
        <p className="text-[16px] text-[var(--text-secondary)] max-w-3xl leading-relaxed">
          Manage your subscription, workspace limits, and upgrade access from one place.
        </p>
      </div>

      <Card className={`mb-12 rounded-lg ${isPro ? 'border-[#D4AF37]/60' : ''}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-7 p-8 pr-10">
          <div className="flex items-center gap-5 min-w-0">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border shrink-0 ${
              isPro
                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/45'
                : 'bg-blue-500/10 text-blue-400 border-[var(--accent-border)]'
            }`}>
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-[12px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2">Current Plan</p>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className={`text-[30px] font-semibold leading-none ${isPro ? 'text-[#D4AF37]' : 'text-[var(--fg)]'}`}>
                  {plan}
                </h2>
                <Badge variant={isPro ? 'yellow' : 'default'}>ACTIVE</Badge>
              </div>
              <p className="text-[14px] text-[var(--text-secondary)] mt-3 max-w-2xl leading-relaxed">
                {isPro
                  ? 'Your workspace has Pro access with expanded limits and premium collaboration features.'
                  : 'You are on the free plan. Upgrade to Pro to unlock expanded workspace limits and AI-powered features.'}
              </p>
            </div>
          </div>
          {!isPro ? (
            <Button
              variant="primary"
              onClick={handleUpgrade}
              disabled={upgrading}
              className="h-11 min-w-[152px] px-5 text-[14px] rounded-lg justify-center shrink-0"
            >
              {upgrading && <Loader2 size={14} className="animate-spin" />}
              Upgrade to Pro
            </Button>
          ) : (
            <div className="h-11 min-w-[132px] px-5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center text-[14px] font-semibold shrink-0 lg:mr-2">
              Pro Active
            </div>
          )}
        </div>
      </Card>

      <div className="mb-12">
        <h3 className="text-[20px] font-semibold text-[var(--fg)] mb-5">Workspace Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Projects', used: projects, limit: projects_limit },
            { label: 'Members', used: members, limit: members_limit },
          ].map(({ label, used, limit }) => (
            <Card key={label} className="rounded-lg min-h-[118px]">
              <CardContent className="px-7 pt-7 pb-7">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <p className="text-[16px] font-semibold text-[var(--fg)] mb-1">{label}</p>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                      {isPro ? 'Expanded Pro limit available for this workspace.' : `Included in the ${plan.toLowerCase()} plan.`}
                    </p>
                  </div>
                  <p className="text-[14px] text-[var(--text-muted)] whitespace-nowrap">
                    <span className="text-[var(--fg)] font-semibold">{used}</span> / {isPro ? 'Unlimited' : limit}
                  </p>
                </div>
                <Progress
                  value={used}
                  max={isPro ? Math.max(used, 10) : limit}
                  colorClass={!isPro && used >= limit ? 'bg-red-500' : isPro ? 'bg-[#D4AF37]' : 'bg-blue-500'}
                />
                {!isPro && used >= limit && (
                  <p className="text-[12px] text-red-400 mt-2 flex items-center gap-1.5 font-medium">
                    <AlertCircle size={13} /> Limit reached - upgrade to add more
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[20px] font-semibold text-[var(--fg)] mb-5">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="relative overflow-hidden rounded-lg min-h-[420px] flex flex-col" style={{ padding: '34px 38px' }}>
            <h4 className="text-[24px] font-semibold text-[var(--fg)] mb-4">Starter</h4>
            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-[42px] font-bold text-[var(--fg)] leading-none">₹0</span>
              <span className="text-[16px] text-[var(--text-muted)]">/ month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {['1 workspace', 'Up to 3 projects', 'Up to 5 members', 'Core collaboration features', 'No AI features'].map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-[15px] text-[var(--text-secondary)] leading-relaxed">
                  <CheckCircle2 size={16} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            {isPro ? (
              <button
                type="button"
                onClick={handlePreviousPlan}
                className="h-12 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] flex items-center justify-center text-[15px] font-semibold text-[var(--fg)] transition-colors"
              >
                Previous Plan
              </button>
            ) : (
              <div className="h-12 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] flex items-center justify-center text-[15px] font-semibold text-[var(--fg)]">
                Current Plan
              </div>
            )}
          </Card>

          <Card className={`flex flex-col relative overflow-hidden rounded-lg min-h-[420px] ${isPro ? 'border-[#D4AF37]/60' : 'border-[var(--border-focus)]'}`} style={{ padding: '34px 38px' }}>
            <div className="absolute top-6 right-6">
              <Badge variant={isPro ? 'yellow' : 'blue'}>{isPro ? 'ACTIVE' : 'RECOMMENDED'}</Badge>
            </div>
            <h4 className={`text-[24px] font-semibold mb-4 pr-28 ${isPro ? 'text-[#D4AF37]' : 'text-[var(--fg)]'}`}>Pro</h4>
            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-[42px] font-bold text-[var(--fg)] leading-none">₹999</span>
              <span className="text-[16px] text-[var(--text-muted)]">/ month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {['Unlimited workspaces', 'Unlimited projects', 'Unlimited members', 'AI Assistant', 'AI Code Reviewer', 'Project Summariser', 'Standup Generator', 'Task Breakdown'].map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-[15px] text-[var(--text-secondary)] leading-relaxed">
                  <CheckCircle2 size={16} className={`${isPro ? 'text-[#D4AF37]' : 'text-blue-400'} shrink-0 mt-0.5`} />
                  {feature}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className="w-full h-12 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center text-[15px] font-semibold mt-4">
                Pro Active
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-full h-12 justify-center rounded-lg text-[15px] font-semibold"
                onClick={handleUpgrade}
                disabled={upgrading}
              >
                {upgrading && <Loader2 size={14} className="animate-spin" />}
                Upgrade to Pro
              </Button>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
