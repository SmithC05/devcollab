import { memo } from 'react';

const StatCard = memo(({ label, value, icon: Icon, trend }) => {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-xl p-5 flex items-center justify-between hover:border-[var(--border-focus)] transition-colors">
      <div>
        <p className="text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">{label}</p>
        <div className="flex items-end gap-3">
          <p className="text-[26px] font-semibold text-[var(--fg)] tabular-nums leading-none">{value}</p>
          {trend && (
            <span className={`text-[12px] font-medium leading-relaxed ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-[var(--surface-item)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)]">
          <Icon className="text-[var(--text-secondary)]" size={18} strokeWidth={2} />
        </div>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';
export { StatCard };
