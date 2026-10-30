import { type FC, type HTMLAttributes } from 'react';

export const Card: FC<HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`border border-ink bg-cream ${className}`} {...props} />
);
