import { Search } from 'lucide-react';
import { forwardRef } from 'react';

const SearchInput = forwardRef(({ className = '', wrapperClassName = '', style, ...props }, ref) => {
  return (
    <div className={`relative flex-1 min-w-[200px] max-w-sm ${wrapperClassName}`}>
      <Search
        className="absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
        style={{ left: 14 }}
        size={14}
      />
      <input
        ref={ref}
        type="text"
        className={`w-full h-[36px] bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-lg pr-4 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] focus:bg-[var(--surface-hover)] transition-colors outline-none ${className}`}
        style={{ paddingLeft: 44, ...style }}
        {...props}
      />
    </div>
  );
});

SearchInput.displayName = 'SearchInput';
export { SearchInput };
