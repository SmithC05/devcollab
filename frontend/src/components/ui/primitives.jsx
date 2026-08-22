// Spinner, Badge, Input, EmptyState, Avatar, Progress primitives

export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      className={`animate-spin text-[var(--text-muted)] ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

const badgeVariants = {
  default: 'bg-[var(--surface-item)] text-[var(--text-secondary)] border border-[var(--border-strong)]',
  green:   'bg-green-500/10 text-green-500 border border-green-500/20',
  blue:    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  yellow:  'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  red:     'bg-red-500/10 text-red-400 border border-red-500/20',
};

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeVariants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-md px-3 py-2 text-[13px] text-[var(--fg)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] transition-colors ${className}`}
      {...props}
    />
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[var(--border-strong)] rounded-xl bg-[var(--surface-card)]/50">
      {Icon && (
        <div className="w-12 h-12 bg-[var(--surface-item)] rounded-full flex items-center justify-center mb-4">
          <Icon size={22} className="text-[var(--text-muted)]" />
        </div>
      )}
      {title && <p className="text-[14px] font-medium text-[var(--fg)] mb-1">{title}</p>}
      {description && <p className="text-[13px] text-[var(--text-secondary)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({ name = '', size = 32, className = '' }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`rounded-full bg-[var(--surface-item)] border border-[var(--border-strong)] flex items-center justify-center font-medium text-[var(--text-secondary)] shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
}

export function Progress({ value = 0, max = 100, colorClass = 'bg-blue-500', className = '' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={`w-full h-1.5 bg-[var(--surface-item)] rounded-full overflow-hidden ${className}`}>
      <div className={`h-full rounded-full ${colorClass} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}
