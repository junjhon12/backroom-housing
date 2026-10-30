import { type FC } from 'react';

interface PropertyImageProps {
  src?: string;
  alt: string;
  reference?: string;
  className?: string;
  /** Load immediately instead of lazily — use for the first image above the fold. */
  eager?: boolean;
  /** Drop the caption for very small frames, such as console thumbnails. */
  compact?: boolean;
}

/**
 * One frame for listing photography. Every frame is given its aspect ratio by
 * the parent so the layout does not shift while the image loads, and a missing
 * photograph renders as a designed "withheld" state rather than a broken icon.
 */
export const PropertyImage: FC<PropertyImageProps> = ({
  src,
  alt,
  reference,
  className = '',
  eager = false,
  compact = false,
}) => {
  if (!src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-paper-deep px-2 text-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={compact ? 'h-4 w-4 text-ink/40' : 'h-6 w-6 text-ink/40'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="5" width="18" height="14" />
          <path d="M3 19 21 5" />
        </svg>

        {!compact && (
          <>
            <span className="text-[10px] uppercase leading-tight tracking-[0.18em] text-ink/55">
              No photograph
            </span>
            {reference && (
              <span className="text-[9px] uppercase leading-tight tracking-[0.18em] text-ink/40">
                {reference}
              </span>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  );
};
