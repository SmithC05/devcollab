/**
 * WorkspaceAIAssistantPage.jsx — Phase 3
 * Entry point for natural-language intent dispatch.
 * Wired to POST /api/ai/agent/ with full project context.
 * Renders structured MEMBER_UNAVAILABLE response via MemberUnavailableResultCard.
 */

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Code2, FileText, CheckSquare, ListTodo, ArrowUp,
  AlertTriangle, ChevronDown, Zap, Clock, HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import { Card, Button } from '../ui/index';
import { useAuthStore } from '../../stores/authStore';
import MemberUnavailableResultCard from '../../features/devcollab-intelligence/components/MemberUnavailableResultCard';
import { apiClient } from '../../api/client';

const API_BASE = 'http://localhost:8000/api';

// Quick-action chips for the Phase 3 hero scenario
const QUICK_ACTIONS = [
  { label: "I'm unavailable for 3 days", icon: AlertTriangle, color: '#ff4466' },
  { label: "Handle my critical work", icon: Zap, color: '#f59e0b' },
  { label: "I'm out until Friday", icon: Clock, color: '#6366f1' },
  { label: "Who can take over my tasks?", icon: CheckSquare, color: '#22c55e' },
];

const CAPABILITIES = [
  { icon: Code2,      title: 'Code Review',         desc: 'Analyze pull requests and commits' },
  { icon: FileText,   title: 'Project Summary',      desc: 'Get a quick overview of project health' },
  { icon: CheckSquare,title: 'Generate Standup',     desc: 'Compile your recent activity' },
  { icon: ListTodo,   title: 'Break Down Task',      desc: 'Split large features into sub-tasks' },
];

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
      <div className="bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-2xl px-5 py-3.5">
        <div className="flex items-center gap-1.5 text-blue-400 mb-2">
          <Sparkles size={13} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">DevCollab Agent</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map(delay => (
            <div key={delay} className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ClarificationCard({ message, onReply }) {
  const [reply, setReply] = useState('');
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--surface-card)', border: '1px solid var(--border-strong)',
        borderRadius: 14, padding: '16px 18px', marginTop: 4,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <HelpCircle size={14} color="#6366f1" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: '0.06em' }}>
          CLARIFICATION NEEDED
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--fg)', marginBottom: 12, lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['1 day', '3 days', '1 week', 'Until Friday'].map(opt => (
          <button key={opt} onClick={() => onReply(opt)}
            style={{
              padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: 'var(--surface-item)', border: '1px solid var(--border-strong)',
              color: 'var(--fg)', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#818cf8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--fg)'; }}
          >
            {opt}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function WorkspaceAIAssistantPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { activeWorkspace, user: currentUser } = useAuthStore();

  // Resolve project_id — use first project from workspace
  const getProjectId = () => {
    // Try to get from active workspace; fallback to 1 for demo
    return activeWorkspace?.first_project_id || activeWorkspace?.projects?.[0]?.id || 1;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callAgent = async (messageText) => {
    const { accessToken } = useAuthStore.getState();
    const projectId = getProjectId();

    const response = await apiClient('/ai/agent/', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        message: messageText,
      }),
    });
    return response;
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const text = query.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setQuery('');
    setLoading(true);

    try {
      const data = await callAgent(text);

      // Detect intent and render structured card
      if (data.intent === 'MEMBER_UNAVAILABLE') {
        setMessages(prev => [...prev, {
          role: 'ai',
          type: 'MEMBER_UNAVAILABLE',
          content: data.message,
          result: data,
          username: currentUser?.username || 'You',
        }]);
      } else if (data.requires_clarification) {
        setMessages(prev => [...prev, {
          role: 'ai',
          type: 'CLARIFICATION',
          content: data.message,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'ai',
          type: 'TEXT',
          content: data.message || 'Analysis complete.',
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        type: 'TEXT',
        content: `There was a problem reaching the DevCollab Agent: ${err.message}. Please check your connection.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (label) => {
    setQuery(label);
    setTimeout(() => handleSubmit(null), 50);
  };

  const handleClarificationReply = (reply) => {
    setQuery(reply);
    handleSubmit(null);
  };

  return (
    <PageContainer>
      <div className="flex flex-col max-w-3xl mx-auto w-full" style={{ minHeight: 'calc(100vh - 44px - 56px)' }}>

        {/* Content Area */}
        <div className="flex-1 pb-44 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-14 h-14 bg-blue-500/10 border border-[var(--accent-border)] rounded-2xl flex items-center justify-center text-blue-400 mb-6"
              >
                <Sparkles size={26} />
              </motion.div>
              <h1 className="text-[26px] font-semibold text-[var(--fg)] mb-2">How can I help you today?</h1>
              <p className="text-[14px] text-[var(--text-secondary)] mb-8">
                Ask anything about your project or declare your availability.
              </p>

              {/* Quick Actions — Phase 3 Hero Scenario */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                {QUICK_ACTIONS.map(({ label, icon: Icon, color }) => (
                  <motion.button
                    key={label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleQuickAction(label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '7px 14px', borderRadius: 100, cursor: 'pointer',
                      background: `${color}15`, border: `1px solid ${color}35`,
                      color, fontSize: 12, fontWeight: 600, transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={12} />
                    {label}
                  </motion.button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                {CAPABILITIES.map((cap, i) => (
                  <Card
                    as="button"
                    key={i}
                    onClick={() => setQuery(`${cap.title} for my recent work`)}
                    hover={true}
                    className="p-5 text-left flex gap-3.5 group items-start"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--surface-item)] border border-[var(--border-strong)] text-[var(--text-muted)] flex items-center justify-center group-hover:text-[var(--text-primary)] group-hover:bg-[var(--surface-raised)] transition-colors shrink-0">
                      <cap.icon size={17} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="text-[14px] font-medium text-[var(--fg)] group-hover:text-[var(--text-primary)] transition-colors mb-0.5">{cap.title}</h3>
                      <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{cap.desc}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 pt-4">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'user' ? (
                      <div className="max-w-[80%] rounded-2xl px-5 py-3.5 bg-[var(--surface-item)] border border-[var(--border-strong)] text-[var(--fg)]">
                        <p className="text-[13.5px] leading-relaxed">{msg.content}</p>
                      </div>
                    ) : (
                      <div style={{ maxWidth: '90%', width: '100%' }}>
                        {/* AI header label */}
                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                          <Sparkles size={13} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider">DevCollab Agent</span>
                        </div>

                        {/* Text message */}
                        {(msg.type === 'TEXT' || !msg.type) && (
                          <div className="bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-2xl px-5 py-3.5">
                            <p className="text-[13.5px] leading-relaxed text-[var(--fg)]">{msg.content}</p>
                          </div>
                        )}

                        {/* MEMBER_UNAVAILABLE structured card */}
                        {msg.type === 'MEMBER_UNAVAILABLE' && (
                          <>
                            {msg.content && (
                              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>{msg.content}</p>
                            )}
                            <MemberUnavailableResultCard
                              result={msg.result}
                              username={msg.username}
                            />
                          </>
                        )}

                        {/* Clarification card */}
                        {msg.type === 'CLARIFICATION' && (
                          <ClarificationCard
                            message={msg.content}
                            onReply={handleClarificationReply}
                          />
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar — fixed to bottom */}
        <div
          className="fixed bottom-0 left-[240px] right-0 p-5 md:p-6"
          style={{ background: 'linear-gradient(to top, var(--bg) 60%, transparent)' }}
        >
          <form
            onSubmit={handleSubmit}
            className="relative max-w-2xl mx-auto flex items-end bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-2xl overflow-hidden focus-within:border-[var(--border-focus)] transition-colors"
          >
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Try: I'm unavailable for the next 3 days. Please handle my critical work."
              className="w-full max-h-[180px] min-h-[52px] py-4 pl-5 pr-14 bg-transparent text-[14px] text-[var(--fg)] placeholder-[var(--text-muted)] resize-none focus:outline-none"
              rows={1}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!query.trim() || loading}
              className="absolute right-3 bottom-3 !w-8 !h-8 !p-0 !rounded-lg disabled:opacity-40"
              icon={ArrowUp}
              iconSize={15}
            />
          </form>
          <p className="text-center text-[11px] text-[var(--text-muted)] mt-3">
            DevCollab Agent is connected to your real engineering state. Availability changes take effect immediately.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
