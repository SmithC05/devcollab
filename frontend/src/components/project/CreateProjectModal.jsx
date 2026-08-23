import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateProjectModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
      setLoading(false);
      // Small delay to allow animation to complete before focusing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Project Name is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onCreate(trimmedName);
    } catch (err) {
      setError(err.message || 'Failed to create project.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-[6px]"
            onClick={!loading ? onClose : undefined}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-[calc(100vw-32px)] md:w-[620px] min-h-[280px] md:min-h-[320px] bg-[#151515] border border-[#2A2A2A] rounded-[18px] shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Close Button */}
            <button
              onClick={!loading ? onClose : undefined}
              className="absolute top-5 right-5 p-1 text-[#A3A3A3] hover:text-white transition-colors"
              aria-label="Close modal"
              disabled={loading}
            >
              <X size={20} />
            </button>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              {/* Header */}
              <div className="pt-8 px-8 pb-6">
                <h2 id="modal-title" className="text-[22px] md:text-[24px] font-bold text-white mb-2 leading-tight">
                  Create New Project
                </h2>
                <p className="text-[14px] md:text-[15px] text-[#A3A3A3]">
                  Enter the details for your new project. Click save when you're done.
                </p>
              </div>

              {/* Body */}
              <div className="px-8 flex-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor="projectName" className="text-[14px] font-semibold text-white">
                    Project Name
                  </label>
                  <input
                    id="projectName"
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full h-[48px] md:h-[52px] rounded-[10px] md:rounded-[12px] bg-[#111111] border border-[#333333] text-white px-4 focus:outline-none focus:border-[#737373] transition-colors"
                    placeholder="e.g. Frontend App"
                  />
                  {error && (
                    <span className="text-red-400 text-[13px] mt-1">{error}</span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 pt-6 flex items-center justify-end gap-3 mt-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-5 py-2.5 text-[#A3A3A3] hover:text-white font-medium text-[14px] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-white text-black font-semibold text-[14px] rounded-[10px] hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
