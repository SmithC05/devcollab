// src/components/auth/AuthDivider.jsx
// "─── OR CONTINUE WITH ───"

export default function AuthDivider() {
  return (
    <div className="flex items-center gap-3 my-[8px]" role="separator" aria-label="Or continue with email">
      <div className="flex-1 h-px bg-[#242424] dark:bg-[#242424] light:bg-[#E5E5E5]" />
      <span className="text-[12px] font-semibold tracking-wide uppercase text-[#737373] dark:text-[#737373] light:text-[#737373] select-none whitespace-nowrap">
        Or continue with
      </span>
      <div className="flex-1 h-px bg-[#242424] dark:bg-[#242424] light:bg-[#E5E5E5]" />
    </div>
  );
}
