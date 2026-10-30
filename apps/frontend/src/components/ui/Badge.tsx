import { type FC, type ReactNode } from 'react';

type BadgeVariant = 'default' | 'accent' | 'moss' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'border-ink bg-ink text-cream',
  accent: 'border-magenta bg-magenta text-cream',
  moss: 'border-ink bg-moss text-ink',
  outline: 'border-ink bg-transparent text-ink',
};

export const Badge: FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => (
  <span
    className={`inline-block border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${VARIANTS[variant]} ${className}`}
  >
    {children}
  </span>
);
