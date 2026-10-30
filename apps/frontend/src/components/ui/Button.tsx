import { type ButtonHTMLAttributes, type FC } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const BASE =
  'inline-flex items-center justify-center gap-2 border font-mono uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-40';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'border-ink bg-ink text-cream hover:bg-cream hover:text-ink',
  secondary: 'border-ink bg-transparent text-ink hover:bg-ink hover:text-cream',
  danger: 'border-signal bg-signal text-cream hover:bg-ink hover:border-ink hover:text-cream',
  ghost: 'border-transparent bg-transparent text-ink hover:underline underline-offset-4',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[10px]',
  md: 'px-5 py-2.5 text-[11px]',
};

export const buttonStyles = ({
  variant = 'primary',
  size = 'md',
  className = '',
}: ButtonStyleOptions = {}): string =>
  [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(' ');

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button: FC<ButtonProps> = ({ variant, size, className, ...props }) => (
  <button className={buttonStyles({ variant, size, className })} {...props} />
);
