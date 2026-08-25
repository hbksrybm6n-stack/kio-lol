import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}

function Switch({ checked, onChange, onCheckedChange, label, description, className, ...props }: SwitchProps) {
  const handleChange = (val: boolean) => {
    if (onCheckedChange) onCheckedChange(val);
    if (onChange) onChange(val);
  };

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && <span className="text-sm font-medium text-[var(--color-nx-text)]">{label}</span>}
          {description && <span className="text-xs text-[var(--color-nx-text-muted)]">{description}</span>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => handleChange(!checked)}
        className={cn(
          'relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-nx-accent)]/40',
          checked ? 'bg-[var(--color-nx-accent)]' : 'bg-white/[0.1]'
        )}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 translate-y-[2px]',
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
          )}
        />
      </button>
    </div>
  );
}

export { Switch, type SwitchProps };
