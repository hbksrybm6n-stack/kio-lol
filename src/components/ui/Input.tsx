import { cn } from '@/lib/utils';
import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	hint?: string;
	error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, label, hint, error, id, ...props }, ref) => {
		const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

		return (
			<div className="flex flex-col gap-1.5">
				{label && (
					<label
						htmlFor={inputId}
						className="text-sm font-medium text-[var(--color-nx-text)]"
					>
						{label}
					</label>
				)}
				<input
					ref={ref}
					id={inputId}
					className={cn(
						'h-10 px-3.5 bg-[var(--color-nx-surface-2)] border border-white/[0.07] rounded-lg text-sm',
						'text-[var(--color-nx-text)] placeholder:text-[var(--color-nx-text-dim)]',
						'outline-none transition-all duration-150',
						'focus:border-[var(--color-nx-accent)] focus:ring-1 focus:ring-[var(--color-nx-accent)]/20',
						error && 'border-[var(--color-nx-danger)] focus:border-[var(--color-nx-danger)] focus:ring-[var(--color-nx-danger)]/20',
						className
					)}
					{...props}
				/>
				{hint && !error && (
					<p className="text-xs text-[var(--color-nx-text-dim)]">{hint}</p>
				)}
				{error && (
					<p className="text-xs text-[var(--color-nx-danger)]">{error}</p>
				)}
			</div>
		);
	}
);

Input.displayName = 'Input';

export { Input, type InputProps };
