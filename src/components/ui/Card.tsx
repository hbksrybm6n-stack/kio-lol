import { cn } from '@/lib/utils';
import { type HTMLAttributes, forwardRef } from 'react';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	hover?: boolean;
	padding?: Padding;
}

const paddingStyles: Record<Padding, string> = {
	none: 'p-0',
	sm: 'p-3',
	md: 'p-4',
	lg: 'p-6',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
	({ className, hover = false, padding = 'md', children, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn(
					'bg-[var(--color-nx-surface)] border border-white/[0.06] rounded-xl',
					hover && 'transition-colors hover:border-[var(--color-nx-border-hover)]',
					paddingStyles[padding],
					className
				)}
				{...props}
			>
				{children}
			</div>
		);
	}
);

Card.displayName = 'Card';

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3
			className={cn('text-base font-semibold text-[var(--color-nx-text)]', className)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={cn('text-sm text-[var(--color-nx-text-muted)]', className)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('mt-4', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, type CardProps };
