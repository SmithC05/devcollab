// src/components/auth/ThemeToggle.jsx
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="
 fixed top-5 right-5 z-50
 w-10 h-10 rounded-full
 flex items-center justify-center
 border border-[var(--border-strong)]
 bg-[var(--surface-item)] 
 text-[var(--text-muted)] hover:text-[var(--text-primary)]
 
 light:hover:text-black
 transition-colors duration-200
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
 "
    >
      {isDark ? (
        <Sun size={16} strokeWidth={2} />
      ) : (
        <Moon size={16} strokeWidth={2} />
      )}
    </button>
  );
}
