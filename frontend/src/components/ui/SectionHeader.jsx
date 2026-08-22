import { memo } from 'react';

const SectionHeader = memo(({ title, description, action, eyebrow }) => {
  return (
    <div className="flex items-start justify-between flex-wrap gap-6 mb-9">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[28px] font-semibold text-[var(--text-primary)] mb-1.5 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[14px] text-[var(--text-secondary)] max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';
export { SectionHeader };
