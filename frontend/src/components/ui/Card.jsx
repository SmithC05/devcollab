// Card primitive — composable dark card with consistent surface/border tokens
export function Card({ children, className = '', hover = false, as: Tag = 'div', ...props }) {
  const hoverClass = hover ? 'hover:border-[var(--border-focus)] cursor-pointer transition-colors' : '';
  return (
    <Tag
      className={`bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-xl ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between px-5 pt-5 pb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-5 pb-5 ${className}`}>
      {children}
    </div>
  );
}
