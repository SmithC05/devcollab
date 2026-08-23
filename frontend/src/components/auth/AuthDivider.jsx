// src/components/auth/AuthDivider.jsx
// "─── OR CONTINUE WITH ───"

export default function AuthDivider() {
  return (
    <div
      className="flex items-center gap-3 my-[8px]"
      role="separator"
      aria-label="Or continue with email"
    >
      <div className="flex-1 h-px bg-[var(--border-subtle)] " />
      <span className="text-[12px] font-semibold tracking-wide uppercase text-[var(--text-muted)] select-none whitespace-nowrap">
        Or continue with
      </span>
      <div className="flex-1 h-px bg-[var(--border-subtle)] " />
    </div>
  );
}
