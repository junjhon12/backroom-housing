import { type FC, type ReactNode } from 'react';

export type BadgeVariant = 'default' | 'signal' | 'moss' | 'outline' | 'carpet';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'border-ink bg-ink text-cream',
  signal: 'border-signal bg-signal text-cream',
  moss: 'border-ink bg-moss text-ink',
  outline: 'border-ink bg-transparent text-ink',
  carpet: 'border-ink bg-carpet text-cream',
};

export const Badge: FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => (
  <span
    className={`inline-block border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${VARIANTS[variant]} ${className}`}
  >
    {children}
  </span>
);
