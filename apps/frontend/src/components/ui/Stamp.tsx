import { type FC, type ReactNode } from 'react';

/**
 * A rotated rubber-stamp mark, used sparingly to mark a file as inspected.
 */
export const Stamp: FC<{ children: ReactNode }> = ({ children }) => (
  <span className="inline-block -rotate-2 border-2 border-signal px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-signal">
    {children}
  </span>
);
