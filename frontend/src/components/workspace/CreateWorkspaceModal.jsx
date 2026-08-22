// src/components/workspace/CreateWorkspaceModal.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

export default function CreateWorkspaceModal({ isOpen, onClose, onCreate }) {
  const [wsName, setWsName] = useState('');
  const [wsSlug, setWsSlug] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (val) => {
    setWsName(val);
    if (!wsSlug || wsSlug === slugify(wsName)) {
      setWsSlug(slugify(val));
    }
    setErrors(p => ({ ...p, name: undefined }));
  };

  const slugify = (str) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!wsName.trim()) errs.name = 'Workspace Name is required.';
    if (!wsSlug.trim()) errs.slug = 'Workspace URL Slug is required.';
    else if (!/^[a-z0-9-]+$/.test(wsSlug)) errs.slug = 'Use only lowercase letters, numbers, and hyphens.';
    
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    
    setErrors({});
    setIsLoading(true);
    
    try {
      await onCreate(wsName, wsSlug, wsDesc);
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
                maxWidth: 640,
                background: '#171717',
                borderRadius: 20,
                border: '1px solid #292929'
              }}
            >
              <div style={{ padding: '32px' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-[24px] font-bold text-white tracking-tight leading-tight">
                    Create a Workspace
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-[var(--border-default)] transition-colors focus-visible:outline-none"
                    aria-label="Close modal"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>

                <p className="text-[14px] leading-[1.6] text-[#A3A3A3] mb-8 pr-8">
                  Workspaces are where your team can collaborate on projects, manage tasks, and share code snippets.
                </p>

                {errors.form && (
                  <p role="alert" className="text-[12px] text-[#f87171] bg-[#2a1111] border border-[#3a1a1a] rounded-xl px-4 py-3 mb-6">
                    {errors.form}
                  </p>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {/* Name Input */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="ws-name" className="text-[14px] font-semibold text-white">
                      Workspace Name
                    </label>
                    <input
                      id="ws-name"
                      type="text"
                      value={wsName}
                      onChange={e => handleNameChange(e.target.value)}
                      placeholder="Acme Corp"
                      disabled={isLoading}
                      className={`
                        w-full h-[56px] px-4 rounded-[14px] text-[15px]
                        bg-[#0F0F0F] text-white placeholder:text-[var(--text-muted)]
                        border transition-colors outline-none
                        focus:border-[var(--text-muted)]
                        ${errors.name ? 'border-[#f87171]' : 'border-[#292929]'}
                      `}
                    />
                    {errors.name && <p className="text-[12px] text-[#f87171]">{errors.name}</p>}
                  </div>

                  {/* Slug Input */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="ws-slug" className="text-[14px] font-semibold text-white">
                      Workspace URL Slug
                    </label>
                    <input
                      id="ws-slug"
                      type="text"
                      value={wsSlug}
                      onChange={e => {
                        setWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                        setErrors(p => ({ ...p, slug: undefined }));
                      }}
                      placeholder="acme-corp"
                      disabled={isLoading}
                      className={`
                        w-full h-[56px] px-4 rounded-[14px] text-[15px]
                        bg-[#0F0F0F] text-white placeholder:text-[var(--text-muted)]
                        border transition-colors outline-none
                        focus:border-[var(--text-muted)]
                        ${errors.slug ? 'border-[#f87171]' : 'border-[#292929]'}
                      `}
                    />
                    {errors.slug && <p className="text-[12px] text-[#f87171]">{errors.slug}</p>}
                  </div>

                  {/* Description Textarea */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="ws-desc" className="text-[14px] font-semibold text-white">
                      Description (Optional)
                    </label>
                    <textarea
                      id="ws-desc"
                      value={wsDesc}
                      onChange={e => setWsDesc(e.target.value)}
                      placeholder="A brief description of your workspace..."
                      disabled={isLoading}
                      className="
                        w-full h-[110px] p-4 rounded-[14px] text-[15px] resize-none
                        bg-[#0F0F0F] text-white placeholder:text-[var(--text-muted)]
                        border border-[#292929] transition-colors outline-none
                        focus:border-[var(--text-muted)]
                      "
                    />
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="
                        h-[48px] px-6 rounded-[14px] text-[14px] font-semibold text-white
                        bg-transparent border border-[#292929]
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
                      Create Workspace
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
