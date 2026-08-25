import { cn } from '@/lib/utils';
import { type TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	hint?: string;
	error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, label, hint, error, id, ...props }, ref) => {
		const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

		return (
			<div className="flex flex-col gap-1.5">
				{label && (
					<label
						htmlFor={textareaId}
						className="text-sm font-medium text-[var(--color-nx-text)]"
					>
						{label}
					</label>
				)}
				<textarea
					ref={ref}
					id={textareaId}
					className={cn(
						'min-h-[80px] px-3.5 py-2.5 bg-[var(--color-nx-surface-2)] border border-white/[0.07] rounded-lg text-sm',
						'text-[var(--color-nx-text)] placeholder:text-[var(--color-nx-text-dim)]',
						'outline-none transition-all duration-150 resize-y',
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

Textarea.displayName = 'Textarea';

export { Textarea, type TextareaProps };
