import { cn } from '@/lib/utils';
import { type SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
	label: string;
	value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	options: SelectOption[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
	({ className, label, options, id, ...props }, ref) => {
		const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

		return (
			<div className="flex flex-col gap-1.5">
				{label && (
					<label
						htmlFor={selectId}
						className="text-sm font-medium text-[var(--color-nx-text)]"
					>
						{label}
					</label>
				)}
				<div className="relative">
					<select
						ref={ref}
						id={selectId}
						className={cn(
							'h-10 w-full px-3.5 pr-9 bg-[var(--color-nx-surface-2)] border border-white/[0.07] rounded-lg text-sm',
							'text-[var(--color-nx-text)] appearance-none cursor-pointer',
							'outline-none transition-all duration-150',
							'focus:border-[var(--color-nx-accent)] focus:ring-1 focus:ring-[var(--color-nx-accent)]/20',
							className
						)}
						{...props}
					>
						{options.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
					<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
						<svg
							width="12"
							height="12"
							viewBox="0 0 12 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="text-[var(--color-nx-text-dim)]"
						>
							<path
								d="M3 4.5L6 7.5L9 4.5"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
				</div>
			</div>
		);
	}
);

Select.displayName = 'Select';

export { Select, type SelectProps, type SelectOption };
