import { motion } from 'framer-motion';

export function Tabs({ children, className = '' }) {
  return (
    <div className={`flex items-center bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-lg p-1 h-[36px] ${className}`}>
      {children}
    </div>
  );
}

export function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-3.5 h-full rounded-md text-[12px] font-medium transition-colors outline-none select-none z-10 ${
        active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--fg)]'
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute inset-0 bg-[var(--border-strong)] rounded-md z-[-1]"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      {children}
    </button>
  );
}
