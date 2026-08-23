import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText, isDanger }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-[calc(100vw-32px)] md:w-[440px] bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-[18px] shadow-2xl flex flex-col p-8 items-center text-center"
            role="dialog"
            aria-modal="true"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${isDanger ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
              <AlertTriangle className={isDanger ? 'text-red-500' : 'text-yellow-500'} size={32} />
            </div>

            <h2 className="text-[20px] md:text-[22px] font-bold text-[var(--text-primary)] mb-2 leading-tight">
              {title}
            </h2>
            <p className="text-[14px] text-[var(--text-secondary)] mb-8 leading-relaxed">
              {message}
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-[var(--surface-item)] border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-[14px] rounded-[10px] hover:bg-[var(--surface-raised)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-4 py-2.5 font-semibold text-[14px] rounded-[10px] transition-colors ${
                  isDanger 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-[var(--text-primary)] text-[var(--bg)] hover:opacity-90'
                }`}
              >
                {confirmText || 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
