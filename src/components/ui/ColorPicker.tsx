import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

interface ColorPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
	label?: string;
	value: string;
	onChange: (value: string) => void;
}

const PRESETS = [
	'#8b5cf6',
	'#6366f1',
	'#3b82f6',
	'#06b6d4',
	'#22c55e',
	'#eab308',
	'#ef4444',
	'#ec4899',
	'#f97316',
	'#ffffff',
	'#a1a1aa',
	'#52525b',
	'#18181b',
	'#000000',
];

function ColorPicker({ label, value, onChange, className, ...props }: ColorPickerProps) {
	return (
		<div className={cn('flex flex-col gap-2', className)} {...props}>
			{label && (
				<span className="text-sm font-medium text-[var(--color-nx-text)]">{label}</span>
			)}
			<div className="flex items-center gap-3">
				<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/[0.07]">
					<input
						type="color"
						value={value}
						onChange={(e) => onChange(e.target.value)}
						className="absolute -inset-1 h-[150%] w-[150%] cursor-pointer border-0 bg-transparent"
					/>
				</div>
				<input
					type="text"
					value={value}
					onChange={(e) => {
						const v = e.target.value;
						if (/^#[0-9a-f]{0,6}$/i.test(v) || v === '') {
							onChange(v);
						}
					}}
					onBlur={() => {
						if (!/^#[0-9a-f]{6}$/i.test(value)) {
							onChange('#ffffff');
						}
					}}
					maxLength={7}
					className="h-10 flex-1 px-3.5 bg-[var(--color-nx-surface-2)] border border-white/[0.07] rounded-lg text-sm font-mono text-[var(--color-nx-text)] outline-none transition-all duration-150 focus:border-[var(--color-nx-accent)] focus:ring-1 focus:ring-[var(--color-nx-accent)]/20"
				/>
			</div>
			<div className="flex flex-wrap gap-1.5">
				{PRESETS.map((color) => (
					<button
						key={color}
						type="button"
						onClick={() => onChange(color)}
						className={cn(
							'h-6 w-6 rounded-md border transition-all duration-150',
							'hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-nx-accent)]/40',
							value.toLowerCase() === color.toLowerCase()
								? 'border-white/40 ring-1 ring-white/20'
								: 'border-white/[0.07]'
						)}
						style={{ backgroundColor: color }}
						title={color}
					/>
				))}
			</div>
		</div>
	);
}

export { ColorPicker, type ColorPickerProps, PRESETS };
