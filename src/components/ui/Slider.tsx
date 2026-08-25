import { cn } from '@/lib/utils';

interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  suffix?: string;
  className?: string;
}

function Slider({ label, value, onChange, min = 0, max = 100, step = 1, showValue = true, suffix = '', className }: SliderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm text-[var(--color-nx-text)]">{label}</span>}
          {showValue && (
            <span className="text-sm font-mono text-[var(--color-nx-text-muted)]">
              {value}{suffix}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-nx-accent)]
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-nx-surface)]
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-shadow
          [&::-webkit-slider-thumb]:hover:shadow-[0_0_0_4px_rgba(139,92,246,0.15)]"
      />
    </div>
  );
}

export { Slider, type SliderProps };
