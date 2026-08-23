import { useState } from 'react';
import { Sparkles, X, Activity, Play, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { apiClient } from '../../api/client';

export default function AgentPanel({ projectId, isOpen, onClose }) {
  const [request, setRequest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [showTrace, setShowTrace] = useState(false);
  const [actionStatus, setActionStatus] = useState(null); // 'executing', 'success', 'error'

  const handleAnalyze = async () => {
    if (!request.trim()) return;
    setIsLoading(true);
    setResponse(null);
    setActionStatus(null);
    
    try {
      const data = await apiClient('/ai/agent/', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          message: request
        })
      });
      setResponse(data);
    } catch (err) {
      console.error(err);
      setResponse({ error: "Failed to connect to decision agent." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!response?.decision?.prepared_action) return;
    setActionStatus('executing');
    
    try {
      const data = await apiClient('/ai/execute/', {
        method: 'POST',
        body: JSON.stringify({
          action: "assign_task",
          params: response.decision.prepared_action
        })
      });
      if (data.status === 'success') {
        setActionStatus('success');
      } else {
        setActionStatus('error');
      }
    } catch (err) {
      setActionStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-[450px] bg-[var(--surface-hover)] border-l border-[var(--border-strong)] shadow-2xl flex flex-col z-50 text-zinc-200">
      <div className="h-16 border-b border-[var(--border-strong)] flex items-center justify-between px-6 bg-[#0d0d0f]">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="font-medium text-sm">Decision Agent</h2>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Scenario Context</label>
          <div className="bg-[#1c1c1c] p-3 rounded border border-[var(--border-subtle)]">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Potential decision point detected: A developer owning a critical task has gone offline.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Ask Agent</label>
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="E.g. Smith is unavailable. Can Rahul take over Payment API?"
            className="w-full bg-[#1c1c1c] border border-[var(--border-subtle)] rounded p-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 min-h-[80px]"
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !request.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-[var(--text-primary)] font-medium py-2 px-4 rounded text-sm transition-colors flex justify-center items-center space-x-2"
          >
            {isLoading ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Analyzing...' : 'Analyze Interventions'}</span>
          </button>
        </div>

        {response && !response.error && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tool Trace */}
            <div className="border border-[var(--border-subtle)] rounded overflow-hidden">
              <button 
                onClick={() => setShowTrace(!showTrace)}
                className="w-full flex items-center justify-between p-3 bg-[#1c1c1c] text-xs font-medium text-zinc-400"
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Agent Activity Trace</span>
                </div>
                {showTrace ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {showTrace && (
                <div className="p-3 bg-[var(--surface-item)] text-xs font-mono text-zinc-500 space-y-2 border-t border-[var(--border-subtle)]">
                  {response.tool_trace?.map((t, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>{t.tool}()</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Response Message */}
            <p className="text-sm text-zinc-300 leading-relaxed border-l-2 border-indigo-500 pl-3">
              {response.message}
            </p>

            {/* Recommendation Card */}
            {response.decision && (
              <div className="bg-[#1c1c1c] border border-indigo-500/30 rounded p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-1">Recommended Action</h3>
                    <p className="text-lg font-medium text-zinc-100">{response.decision.recommended_action}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold">Confidence</span>
                    <p className="text-sm font-medium text-emerald-400">{response.decision.confidence * 100}%</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  <h4 className="text-xs font-medium text-zinc-400">Reasoning Factors</h4>
                  <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4">
                    {response.decision.reasoning_factors?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  <h4 className="text-xs font-medium text-zinc-400">Tradeoffs Considered</h4>
                  <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4">
                    {response.decision.tradeoffs?.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>

                {/* Simulation Options Table */}
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <h4 className="text-xs font-medium text-zinc-400 mb-2">Simulated Interventions</h4>
                  <div className="space-y-2">
                    {response.decision.options?.map((opt, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 bg-[var(--surface-item)] rounded border border-[var(--border-subtle)]">
                        <span className="font-medium text-zinc-300">{opt.type}</span>
                        <div className="flex space-x-4">
                          <span className="text-zinc-500">{opt.estimated_completion}d</span>
                          <span className={`font-medium ${opt.risk === 'HIGH' ? 'text-red-400' : opt.risk === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {opt.risk} RISK
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Approval Actions */}
                <div className="flex space-x-3 pt-4">
                  <button 
                    onClick={handleApprove}
                    disabled={actionStatus !== null}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-[var(--text-primary)] text-xs font-bold py-2 rounded transition-colors flex items-center justify-center space-x-2"
                  >
                    {actionStatus === 'executing' && <Activity className="w-3.5 h-3.5 animate-spin" />}
                    {actionStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {actionStatus === 'error' && <XCircle className="w-3.5 h-3.5" />}
                    <span>{actionStatus === 'success' ? 'Executed' : 'Approve & Execute'}</span>
                  </button>
                  <button 
                    disabled={actionStatus !== null}
                    className="flex-1 bg-[#2a2a2a] hover:bg-[#333] disabled:opacity-50 text-zinc-300 text-xs font-bold py-2 rounded transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {response?.error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
            {response.error}
          </div>
        )}
      </div>
    </div>
  );
}
