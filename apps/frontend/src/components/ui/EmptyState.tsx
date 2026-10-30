import { type FC, type ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({ title, description, action, className = '' }) => (
  <div className={`border border-dashed border-ink/40 bg-cream/60 px-6 py-16 text-center ${className}`}>
    <h2 className="font-display text-2xl uppercase leading-none">{title}</h2>
    {description && (
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/70">{description}</p>
    )}
    {action && <div className="mt-6 flex justify-center">{action}</div>}
  </div>
);
