export function Table({ children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-xl ${className}`}>
      <table className="w-full text-left border-collapse min-w-[600px]">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead>
      <tr className={`text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-strong)] ${className}`}>
        {children}
      </tr>
    </thead>
  );
}

export function TableHead({ children, className = '' }) {
  return <th className={`px-5 py-4 font-semibold ${className}`}>{children}</th>;
}

export function TableBody({ children, className = '' }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className = '', hover = true }) {
  return (
    <tr className={`group border-b border-[var(--border-subtle)] last:border-none transition-colors ${hover ? 'hover:bg-[var(--surface-item)]' : ''} ${className}`}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return <td className={`px-5 py-4 text-[13px] text-[var(--fg)] ${className}`}>{children}</td>;
}
