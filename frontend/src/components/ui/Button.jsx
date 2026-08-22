// Button primitive
const variants = {
  primary:   'bg-[var(--text-primary)] text-[var(--bg)] hover:opacity-90 font-semibold',
  secondary: 'bg-[var(--surface-card)] border border-[var(--border-strong)] text-[var(--fg)] hover:border-[var(--border-focus)] hover:bg-[var(--surface-item)]',
  ghost:     'text-[var(--text-secondary)] hover:text-[var(--fg)] hover:bg-[var(--surface-item)]',
  danger:    'bg-red-500 text-white hover:bg-red-600',
  accent:    'bg-blue-500 text-white hover:bg-blue-600',
};

const sizes = {
  sm:  'h-7 px-3 text-[12px] rounded-md gap-1.5',
  md:  'h-[36px] px-4 text-[13px] rounded-md gap-2',
  lg:  'h-10 px-5 text-[14px] rounded-md gap-2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  icon: Icon,
  iconSize = 14,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={iconSize} />}
      {children}
    </button>
  );
}
