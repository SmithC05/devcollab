import { useState } from 'react';
import { Sparkles, Code2, FileText, CheckSquare, ListTodo, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import PageContainer from '../../components/layout/PageContainer';

export default function WorkspaceAIAssistantPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setQuery('');
    setLoading(true);

    // Simulate AI response (graceful degradation since backend LLM integration is pending)
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
      <div className="flex flex-col h-[calc(100vh-44px-100px)] max-w-4xl mx-auto w-full relative">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-32">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pt-10">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
              <Sparkles size={32} />
            </div>
            <h1 className="text-3xl font-semibold text-gray-100 mb-3">How can I help you today, dev?</h1>
            <p className="text-[14px] text-[#888] mb-12">Ask anything about your project or development workflow.</p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
              {capabilities.map((cap, i) => (
                <button 
                  key={i}
                  onClick={() => setQuery(cap.title + " for my recent work")}
                  className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-5 text-left hover:border-[#444] transition-colors flex gap-4 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#222] text-[#777] flex items-center justify-center group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                    <cap.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-medium text-gray-200 mb-1 group-hover:text-blue-400 transition-colors">{cap.title}</h3>
                    <p className="text-[12px] text-[#666] leading-relaxed">{cap.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl p-5 ${
                  msg.role === 'user' 
                    ? 'bg-[#2A2A2A] text-gray-100' 
                    : 'bg-[#161616] border border-[#2A2A2A] text-gray-300'
                }`}>
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-3 text-blue-400">
                      <Sparkles size={16} />
                      <span className="text-[12px] font-medium uppercase tracking-wider">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-[14px] leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Sparkles size={16} />
                    <span className="text-[12px] font-medium uppercase tracking-wider">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-1.5 h-6">
                    <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#111] via-[#111] to-transparent">
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto flex items-end bg-[#161616] border border-[#2A2A2A] rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-colors shadow-lg">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask DevCollab anything..."
            className="w-full max-h-[200px] min-h-[56px] py-4 pl-5 pr-14 bg-transparent text-[14px] text-gray-100 placeholder-[#666] resize-none focus:outline-none"
            rows={1}
          />
          <button 
            type="submit" 
            disabled={!query.trim() || loading}
            className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center rounded-lg bg-white text-black disabled:opacity-50 disabled:bg-[#2A2A2A] disabled:text-[#777] transition-all hover:bg-gray-200"
          >
            <Send size={14} className={query.trim() ? "ml-0.5" : ""} />
          </button>
        </form>
        <p className="text-center text-[11px] text-[#555] mt-4">
          DevCollab AI can make mistakes. Consider verifying important code changes.
        </p>
        </div>
      </div>
    </PageContainer>
  );
}
