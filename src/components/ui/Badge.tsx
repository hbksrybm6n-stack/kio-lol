import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'success' | 'danger' | 'info' | 'warning';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
	default:
		'bg-white/[0.06] border-white/[0.08] text-[var(--color-nx-text-muted)]',
	success:
		'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
	danger:
		'bg-red-500/10 border-red-500/20 text-red-400',
	info:
		'bg-blue-500/10 border-blue-500/20 text-blue-400',
	warning:
		'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
};

function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
				variantStyles[variant],
				className
			)}
			{...props}
		>
			{children}
		</span>
	);
}

export { Badge, type BadgeProps, type BadgeVariant };
