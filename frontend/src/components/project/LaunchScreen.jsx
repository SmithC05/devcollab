import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

export default function LaunchScreen({ project, onComplete }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 0ms -> Step 1: Badge appears (initial state)
    // 200ms -> Step 2: Project Name appears
    const t1 = setTimeout(() => setStep(1), 200);
    // 500ms -> Step 3: Status text appears
    const t2 = setTimeout(() => setStep(2), 500);
    // 800ms -> Step 4: Progress begins
    const t3 = setTimeout(() => setStep(3), 800);
    // 2000ms -> Step 5: Complete
    const t4 = setTimeout(() => onComplete(), 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={onComplete}
        role="button"
        tabIndex={0}
        aria-label="Launch Screen. Click or press Escape to skip."
      >
        <div className="flex flex-col items-center max-w-[90vw] text-center w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111111] border border-[#2A2A2A] text-[#A3A3A3] text-[12px] md:text-[13px] font-medium tracking-wide uppercase mb-6"
          >
            <Terminal size={14} className="text-[#A3A3A3]" />
            Launching Project Environment
          </motion.div>

          {/* Project Name */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={step >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-10 w-full"
          >
            <h1 
              className="text-white font-bold uppercase leading-[0.95] tracking-[-3px] md:tracking-[-6px]"
              style={{ fontSize: 'clamp(72px, 10vw, 140px)' }}
            >
              {project?.name || 'PROJECT'}
            </h1>
          </motion.div>

          {/* Status Messages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={step >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-1.5 text-left mb-10 w-full max-w-[420px]"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
          >
            <div className="flex items-start text-[13px] md:text-[15px] text-[#A3A3A3] w-full">
              <span className="mr-3 mt-[1px]">▱</span>
              Mounting Virtual Workspace.
            </div>
            <div className="flex items-start text-[13px] md:text-[15px] text-[#A3A3A3] w-full">
              <span className="mr-3 mt-[1px]">&gt;</span>
              Initializing Terminal & Editor.
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="w-[80vw] max-w-[380px] md:max-w-[420px] h-[2px] bg-[#222222] rounded-full overflow-hidden mb-12">
            <motion.div
              initial={{ width: '0%' }}
              animate={step >= 3 ? { width: '100%' } : { width: '0%' }}
              transition={{ duration: 1.2, ease: "linear" }}
              className="h-full bg-white"
            />
          </div>

          {/* Skip Hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 2 ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[12px] md:text-[14px] text-[#737373] tracking-wide"
          >
            Click or press ESC to enter immediately &rarr;
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
