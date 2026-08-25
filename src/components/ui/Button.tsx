import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'default' | 'ghost' | 'outline' | 'danger' | 'success' | 'link';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	size?: Size;
}

const variantStyles: Record<Variant, string> = {
	default:
		'bg-[var(--color-nx-accent)] hover:bg-[var(--color-nx-accent-hover)] text-white shadow-sm',
	ghost: 'bg-transparent hover:bg-white/[0.06] text-[var(--color-nx-text-dim)] hover:text-white',
	outline:
		'border border-white/[0.08] bg-transparent hover:bg-white/[0.04] text-[var(--color-nx-text)]',
	danger: 'bg-red-600 hover:bg-red-500 text-white',
	success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
	link: 'bg-transparent hover:underline text-[var(--color-nx-accent)] px-0 h-auto',
};

const sizeStyles: Record<Size, string> = {
	xs: 'h-7 px-2 text-xs',
	sm: 'h-8 px-3 text-xs',
	md: 'h-9 px-4 text-sm',
	lg: 'h-10 px-5 text-sm',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant = 'default', size = 'md', disabled, ...props }, ref) => {
		return (
			<button
				ref={ref}
				disabled={disabled}
				className={cn(
					'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-nx-accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-nx-bg)]',
					'active:scale-[0.97]',
					'disabled:pointer-events-none disabled:opacity-50',
					variantStyles[variant],
					sizeStyles[size],
					className
				)}
				{...props}
			/>
		);
	}
);

Button.displayName = 'Button';

export { Button, type ButtonProps, type Variant, type Size };
