import { useState } from 'react';
import { Sparkles, Code2, FileText, CheckSquare, ListTodo, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import { Card, Button } from '../ui/index';

export default function WorkspaceAIAssistantPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setQuery('');
    setLoading(true);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "I'm the DevCollab AI Assistant. My backend integration for natural-language parsing is currently pending setup in the Django REST Framework. Once connected, I'll be able to help you review code, summarize projects, and manage tasks directly from this workspace."
      }]);
      setLoading(false);
    }, 1500);
  };

  const capabilities = [
    { icon: Code2, title: 'Code Review', desc: 'Analyze pull requests and commits' },
    { icon: FileText, title: 'Project Summary', desc: 'Get a quick overview of project health' },
    { icon: CheckSquare, title: 'Generate Standup', desc: 'Compile your recent activity' },
    { icon: ListTodo, title: 'Break Down Task', desc: 'Split large features into sub-tasks' }
  ];

  return (
    <PageContainer>
      <div className="flex flex-col max-w-3xl mx-auto w-full" style={{ minHeight: 'calc(100vh - 44px - 56px)' }}>
        {/* Content Area */}
        <div className="flex-1 pb-36 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-blue-500/10 border border-[var(--accent-border)] rounded-2xl flex items-center justify-center text-blue-400 mb-6">
                <Sparkles size={26} />
              </div>
              <h1 className="text-[26px] font-semibold text-[var(--fg)] mb-2">How can I help you today?</h1>
              <p className="text-[14px] text-[var(--text-secondary)] mb-10">Ask anything about your project or development workflow.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                {capabilities.map((cap, i) => (
                  <Card
                    as="button"
                    key={i}
                    onClick={() => setQuery(cap.title + ' for my recent work')}
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
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                      msg.role === 'user'
                        ? 'bg-[var(--surface-item)] border border-[var(--border-strong)] text-[var(--fg)]'
                        : 'bg-[var(--surface-card)] border border-[var(--border-strong)] text-[var(--fg)]'
                    }`}>
                      {msg.role === 'ai' && (
                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                          <Sparkles size={13} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider">AI Assistant</span>
                        </div>
                      )}
                      <p className="text-[13.5px] leading-relaxed">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-2xl px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-blue-400 mb-2">
                      <Sparkles size={13} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[0, 150, 300].map(delay => (
                        <div key={delay} className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input — absolutely pinned to page bottom */}
        <div className="fixed bottom-0 left-[240px] right-0 p-5 md:p-6" style={{ background: 'linear-gradient(to top, var(--bg) 60%, transparent)' }}>
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
              placeholder="Ask DevCollab anything..."
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
            DevCollab AI can make mistakes. Verify important code changes.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
