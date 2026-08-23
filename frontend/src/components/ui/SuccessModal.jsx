import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuccessModal({ isOpen, onClose, title, message }) {
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
            className="relative w-full max-w-[calc(100vw-32px)] md:w-[420px] bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-[18px] shadow-2xl flex flex-col p-8 items-center text-center"
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

            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 className="text-green-500" size={32} />
            </div>

            <h2 className="text-[20px] md:text-[22px] font-bold text-[var(--text-primary)] mb-2 leading-tight">
              {title}
            </h2>
            <p className="text-[14px] text-[var(--text-secondary)] mb-8 leading-relaxed">
              {message}
            </p>

            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-[var(--text-primary)] text-[var(--bg)] font-semibold text-[14px] rounded-[10px] hover:opacity-90 transition-opacity w-full"
            >
              Okay
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
