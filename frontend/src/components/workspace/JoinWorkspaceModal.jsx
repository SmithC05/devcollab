// src/components/workspace/JoinWorkspaceModal.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

export default function JoinWorkspaceModal({ isOpen, onClose, onJoin }) {
  const [inviteCode, setInviteCode] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setErrors({ code: 'Invite Code is required.' });
      return;
    }
    
    setErrors({});
    setIsLoading(true);
    
    try {
      await onJoin(inviteCode.trim().toUpperCase());
      // Wait for navigation / state updates
    } catch (err) {
      setErrors({ form: err.message });
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0, 0, 0, 0.70)' }}
            onClick={!isLoading ? onClose : undefined}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full pointer-events-auto shadow-2xl overflow-hidden"
              style={{
                maxWidth: 520, // slightly narrower for join
                background: '#171717',
                borderRadius: 20,
                border: '1px solid #292929'
              }}
            >
              <div style={{ padding: '32px' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-[24px] font-bold text-[var(--text-primary)] tracking-tight leading-tight">
                    Join a Workspace
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg text-[#a3a3a3] hover:text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors focus-visible:outline-none"
                    aria-label="Close modal"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>

                <p className="text-[14px] leading-[1.6] text-[var(--text-secondary)] mb-8 pr-8">
                  Enter your team's invite code to join an existing workspace.
                </p>

                {errors.form && (
                  <p role="alert" className="text-[12px] text-[#f87171] bg-[#2a1111] border border-[#3a1a1a] rounded-xl px-4 py-3 mb-6">
                    {errors.form}
                  </p>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {/* Code Input */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="ws-code" className="text-[14px] font-semibold text-[var(--text-primary)]">
                      Workspace Invite Code
                    </label>
                    <input
                      id="ws-code"
                      type="text"
                      value={inviteCode}
                      onChange={e => {
                        setInviteCode(e.target.value.toUpperCase());
                        setErrors({});
                      }}
                      placeholder="DEVTEAM001"
                      disabled={isLoading}
                      className={`
                        w-full h-[56px] px-4 rounded-[14px] text-[15px] tracking-wide font-medium
                        bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                        border transition-colors outline-none
                        focus:border-[var(--text-muted)]
                        ${errors.code ? 'border-[#f87171]' : 'border-[var(--border-subtle)]'}
                      `}
                    />
                    {errors.code && <p className="text-[12px] text-[#f87171]">{errors.code}</p>}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="
                        h-[48px] px-6 rounded-[14px] text-[14px] font-semibold text-[var(--text-primary)]
                        bg-transparent border border-[var(--border-subtle)]
                        hover:bg-[var(--border-default)] transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="
                        h-[48px] px-6 rounded-[14px] text-[14px] font-semibold text-black
                        bg-white border border-white
                        hover:bg-[#f0f0f0] hover:border-[#f0f0f0] transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                      "
                    >
                      {isLoading && <Loader2 size={16} className="animate-spin" />}
                      Join Workspace
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
