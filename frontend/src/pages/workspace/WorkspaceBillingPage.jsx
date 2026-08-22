import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PageContainer from '../../components/layout/PageContainer';

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
    // Simulate integration state
    setTimeout(() => {
      alert("Payment integration is currently under development (Razorpay Sandbox mode pending).");
      setUpgrading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-[#666]">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-32 text-red-400">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const { plan = 'FREE', usage = {} } = data || {};
  const { projects = 0, projects_limit = 3, members = 0, members_limit = 5 } = usage;

  return (
    <PageContainer>
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-100 mb-1">Billing & Plans</h1>
        <p className="text-[13px] text-[#888888]">Manage your subscription, billing details, and plan limits.</p>
      </div>

      {/* Current Plan Banner */}
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-lg p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 border border-blue-500/20">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-[12px] text-[#777] font-medium uppercase tracking-wider mb-0.5">Current Plan</p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-gray-100">{plan}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2A2A2A] text-gray-300">ACTIVE</span>
            </div>
          </div>
        </div>
        {plan === 'FREE' && (
          <button 
            onClick={handleUpgrade}
            disabled={upgrading}
            className="h-[40px] px-6 bg-white text-black font-medium text-[14px] rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {upgrading ? <Loader2 className="animate-spin" size={16} /> : null}
            Upgrade to Pro
          </button>
        )}
      </div>

      {/* Plan Limits */}
      <div className="mb-10">
        <h3 className="text-[15px] font-medium text-gray-100 mb-4">Workspace Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-lg p-5">
            <div className="flex justify-between items-end mb-2">
              <p className="text-[13px] font-medium text-gray-200">Projects</p>
              <p className="text-[12px] text-[#777]"><span className="text-gray-200">{projects}</span> / {projects_limit}</p>
            </div>
            <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${projects >= projects_limit ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min((projects / projects_limit) * 100, 100)}%` }}
              ></div>
            </div>
            {projects >= projects_limit && (
              <p className="text-[11px] text-red-400 mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> Project limit reached
              </p>
            )}
          </div>
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-lg p-5">
            <div className="flex justify-between items-end mb-2">
              <p className="text-[13px] font-medium text-gray-200">Members</p>
              <p className="text-[12px] text-[#777]"><span className="text-gray-200">{members}</span> / {members_limit}</p>
            </div>
            <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${members >= members_limit ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min((members / members_limit) * 100, 100)}%` }}
              ></div>
            </div>
            {members >= members_limit && (
              <p className="text-[11px] text-red-400 mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> Member limit reached
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div>
        <h3 className="text-[15px] font-medium text-gray-100 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-lg p-6 relative overflow-hidden">
            {plan === 'FREE' && <div className="absolute top-0 right-0 border-t-[40px] border-r-[40px] border-t-transparent border-r-[#2A2A2A] opacity-50"></div>}
            <h4 className="text-lg font-medium text-gray-100 mb-1">Starter</h4>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold text-white">$0</span>
              <span className="text-[13px] text-[#777]">/ month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                '1 workspace',
                'Up to 3 projects',
                'Up to 5 members',
                'Core collaboration features',
                'No AI features'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-gray-300">
                  <CheckCircle2 size={16} className="text-[#555] shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full h-[36px] bg-[#222] text-[#888] font-medium text-[13px] rounded-md cursor-default">
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-[#111] border border-blue-500/30 rounded-lg p-6 relative flex flex-col shadow-[0_0_30px_rgba(59,130,246,0.05)]">
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">RECOMMENDED</div>
            <h4 className="text-lg font-medium text-gray-100 mb-1">Pro</h4>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold text-white">Contact</span>
              <span className="text-[13px] text-[#777]">/ Upgrade</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Unlimited workspaces',
                'Unlimited projects',
                'Unlimited members',
                'AI Assistant',
                'AI Code Reviewer',
                'Project Summariser',
                'Standup Generator',
                'Task Breakdown'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-gray-300">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={handleUpgrade}
              className="w-full h-[36px] bg-blue-500 hover:bg-blue-600 text-white font-medium text-[13px] rounded-md transition-colors"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
