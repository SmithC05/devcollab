// src/components/auth/AuthInfoPanel.jsx
// Marketing / branding panel. Logo, animated heading, two feature rows, footer.

import { motion, AnimatePresence } from "framer-motion";
import { Layers, Sparkles } from "lucide-react";

// Simple lightning bolt logo mark
const LogoMark = () => (
  <div className="w-[44px] h-[44px] rounded-full bg-[var(--text-primary)] flex items-center justify-center shrink-0">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill="var(--bg)"
        stroke="var(--bg)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const headings = {
  login: "Welcome back to your workspace.",
  register: "Join the next generation of engineering teams.",
};

const features = [
  {
    icon: Layers,
    title: "Everything Your Team Needs",
    desc: "Projects, tasks, documentation, snippets, and communication in one workspace.",
  },
  {
    icon: Sparkles,
    title: "AI That Works Alongside Your Team",
    desc: "Generate summaries, detect blockers, and review code with project-aware AI.",
  },
];

export default function AuthInfoPanel({ mode }) {
  return (
    <div
      className="h-full flex flex-col justify-between select-none"
      style={{ padding: "60px 60px 50px 60px" }}
    >
      {/* Top Section */}
      <div>
        {/* Logo row */}
        <div className="flex items-center gap-3">
          <LogoMark />
          <span className="text-[var(--text-primary)] text-[20px] md:text-[22px] font-bold tracking-tight">
            DevCollab
          </span>
        </div>

        {/* Animated heading block */}
        <div className="flex flex-col mt-[115px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            >
              <h2
                className="text-[var(--text-primary)] font-bold mb-[40px]"
                style={{
                  fontSize: "42px",
                  lineHeight: 1.05,
                  letterSpacing: "-1.5px",
                  maxWidth: "460px", // enforces the "Welcome back to your \n workspace." wrap
                }}
              >
                {headings[mode]}
              </h2>

              <div className="flex flex-col gap-8">
                {features.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-[18px]">
                    <div className="w-[42px] h-[42px] rounded-full bg-[var(--surface-hover)] flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-[var(--text-primary)]" />
                    </div>
                    <div>
                      <p className="text-[var(--text-primary)] text-[16px] md:text-[17px] font-semibold mb-1">
                        {title}
                      </p>
                      <p className="text-[var(--text-secondary)] text-[15px] leading-[1.5] max-w-[360px]">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[var(--text-muted)] text-[13px]">
        © 2026 DevCollab Inc.
      </p>
    </div>
  );
}
