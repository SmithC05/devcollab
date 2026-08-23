// src/components/auth/AuthInput.jsx
// Reusable labelled input with left icon, optional password toggle.

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthInput({
  id,
  label,
  type = "text",
  icon: Icon,
  placeholder,
  value,
  onChange,
  autoComplete,
  error,
  disabled,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-[10px]">
      {label && (
        <label
          htmlFor={id}
          className="text-[14px] font-semibold text-[var(--text-primary)] "
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Left icon */}
        {Icon && (
          <span
            aria-hidden="true"
            className="absolute left-[18px] top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          >
            <Icon size={20} strokeWidth={2} />
          </span>
        )}

        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`
 w-full h-[58px] rounded-[16px] text-[15px]
 bg-[var(--surface-item)] border text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
 dark:placeholder:text-[var(--text-muted)]
 light:placeholder:text-[var(--text-muted)]
 transition-all duration-150 outline-none
 focus:border-[#555] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.05)]
 disabled:opacity-50 disabled:cursor-not-allowed
 ${
   error
     ? "border-[#555] shadow-[0_0_0_3px_rgba(255,255,255,0.03)]"
     : "border-[var(--border-subtle)] "
 }
 `}
          style={{
            paddingLeft: Icon ? "48px" : "16px",
            paddingRight: isPassword ? "48px" : "16px",
          }}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>

      {/* Inline error */}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[11px] text-[#f87171] mt-0.5"
        >
          {error}
        </p>
      )}
    </div>
  );
}
