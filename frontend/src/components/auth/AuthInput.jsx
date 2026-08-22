// src/components/auth/AuthInput.jsx
// Reusable labelled input with left icon, optional password toggle.

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthInput({
  id,
  label,
  type = 'text',
  icon: Icon,
  placeholder,
  value,
  onChange,
  autoComplete,
  error,
  disabled,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-[10px]">
      {label && (
        <label
          htmlFor={id}
          className="text-[14px] font-semibold text-white dark:text-white"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Left icon */}
        {Icon && (
          <span
            aria-hidden="true"
            className="absolute left-[18px] top-1/2 -translate-y-1/2 text-[#525252] dark:text-[#525252] pointer-events-none"
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
            bg-[#111111] border text-white placeholder:text-[#666666]
            dark:bg-[#111111] dark:text-white dark:placeholder:text-[#666666]
            light:bg-[#F9F9F9] light:text-black light:placeholder:text-[#737373]
            transition-all duration-150 outline-none
            focus:border-[#555] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.05)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? 'border-[#555] shadow-[0_0_0_3px_rgba(255,255,255,0.03)]'
              : 'border-[#292929] dark:border-[#292929] light:border-[#D4D4D4]'
            }
          `}
          style={{ paddingLeft: Icon ? '48px' : '16px', paddingRight: isPassword ? '48px' : '16px' }}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(p => !p)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#a3a3a3] transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>

      {/* Inline error */}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[11px] text-[#f87171] mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}
