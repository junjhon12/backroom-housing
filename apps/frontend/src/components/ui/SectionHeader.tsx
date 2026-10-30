import { type FC } from 'react';

interface SectionHeaderProps {
  index?: string;
  title: string;
  description?: string;
  className?: string;
}

export const SectionHeader: FC<SectionHeaderProps> = ({
  index,
  title,
  description,
  className = '',
}) => (
  <div className={className}>
    {index && (
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">{index}</p>
    )}
    <h2 className="mt-2 font-display text-3xl uppercase leading-none md:text-4xl">{title}</h2>
    {description && (
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">{description}</p>
    )}
  </div>
);
