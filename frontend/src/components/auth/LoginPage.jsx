// src/pages/LoginPage.jsx
// Route /login — renders the AuthShell inside a full-screen centered layout.

import AuthShell from "../auth/AuthShell";
import ThemeToggle from "../auth/ThemeToggle";
import { useTheme } from "../../hooks/useTheme";

export default function LoginPage() {
  // Ensure theme class is applied
  useTheme();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#000000] dark:bg-[#000000] light:bg-[#ffffff]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <ThemeToggle />

      {/* Desktop: full two-panel card */}
      <div className="hidden md:flex w-full items-center justify-center">
        <AuthShell initialMode="login" />
      </div>

      {/* Mobile: single-column form only */}
      <div className="flex md:hidden w-full items-center justify-center">
        <MobileAuthShell />
      </div>
    </div>
  );
}

// ── Mobile fallback ───────────────────────────────────────────────────────
// On small screens: single column, form only, branding hidden.
// Switching still works but no panel animation (just fade).

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoginForm from "../auth/LoginForm";
import RegisterForm from "../auth/RegisterForm";

function MobileAuthShell() {
  const [mode, setMode] = useState('login');

  return (
    <div
      className="w-full max-w-sm rounded-[22px] border border-[#1e1e1e] p-6"
      style={{ background: '#0a0a0a' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
