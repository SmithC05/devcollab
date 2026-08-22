import { forwardRef } from 'react';

const IconButton = forwardRef(({ icon: Icon, onClick, className = '', title, size = 15, active = false, ...props }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-muted)] transition-colors outline-none cursor-pointer flex-shrink-0 ${
        active 
          ? 'bg-[var(--surface-active)] text-[var(--text-primary)]' 
          : 'hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] bg-transparent'
      } ${className}`}
      {...props}
    >
      {Icon && <Icon size={size} />}
    </button>
  );
});

IconButton.displayName = 'IconButton';
export default IconButton;
