import { type FC } from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: FC<SkeletonProps> = ({ className = '' }) => (
  <div aria-hidden="true" className={`animate-pulse bg-ink/10 ${className}`} />
);
