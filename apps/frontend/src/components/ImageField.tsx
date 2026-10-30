import { useRef, useState, type ChangeEvent, type FC } from 'react';
import { uploadImage } from '../services/propertyService';
import { Button } from './ui';

interface ImageFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  max?: number;
}

/**
 * Photographs are uploaded as they are chosen, so the host sees the real cover
 * before submitting. `images[0]` is the cover; the rest form the gallery.
 */
export const ImageField: FC<ImageFieldProps> = ({
  images,
  onChange,
  onUploadingChange,
  max = 6,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setUploadingState = (value: boolean) => {
    setUploading(value);
    onUploadingChange?.(value);
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Reset so choosing the same file twice still fires a change event.
    event.target.value = '';

    if (files.length === 0) return;

    const room = max - images.length;
    if (room <= 0) {
      setError(`A file may hold at most ${max} photographs.`);
      return;
    }

    const batch = files.slice(0, room);
    setError(files.length > room ? `Only ${room} more could be added.` : null);
    setUploadingState(true);

    try {
      // Settle every upload so one bad file doesn't discard the good ones.
      const results = await Promise.allSettled(batch.map((file) => uploadImage(file)));
      const uploaded = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map((result) => result.value);
      const failed = results.length - uploaded.length;

      if (uploaded.length > 0) {
        onChange([...images, ...uploaded]);
      }

      if (failed > 0) {
        setError(`${failed} photograph${failed === 1 ? '' : 's'} failed to upload.`);
      }
    } finally {
      setUploadingState(false);
    }
  };

  const remove = (index: number) => {
    onChange(images.filter((_, current) => current !== index));
  };

  const makeCover = (index: number) => {
    onChange([images[index], ...images.filter((_, current) => current !== index)]);
  };

  const atLimit = images.length >= max;

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url, index) => (
            <li key={url} className="border border-ink bg-paper-deep">
              <div className="relative aspect-[4/3] w-full">
                <img
                  src={url}
                  alt={`Photograph ${index + 1}`}
                  className="h-full w-full object-cover"
                />

                {index === 0 && (
                  <span className="absolute left-0 top-0 bg-ink px-1.5 py-0.5 text-[8px] uppercase tracking-[0.16em] text-cream">
                    Cover
                  </span>
                )}
              </div>

              <div className="flex border-t border-ink">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(index)}
                    className="flex-1 border-r border-ink px-1 py-1.5 text-[9px] uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-cream"
                  >
                    Cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove photograph ${index + 1}`}
                  className="flex-1 px-1 py-1.5 text-[9px] uppercase tracking-[0.12em] text-signal transition-colors hover:bg-signal hover:text-cream"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFiles}
        />

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || atLimit}
        >
          {uploading ? 'Uploading…' : 'Add photographs'}
        </Button>

        <span className="text-[10px] uppercase tracking-[0.14em] text-ink/60">
          {images.length} / {max} · first is the cover
        </span>
      </div>

      {error && (
        <p role="alert" className="text-xs leading-relaxed text-signal">
          {error}
        </p>
      )}
    </div>
  );
};
