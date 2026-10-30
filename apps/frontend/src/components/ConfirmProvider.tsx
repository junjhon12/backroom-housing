import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from 'react';
import { buttonStyles } from './ui';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmRequest {
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const titleId = useId();

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setRequest({ options, resolve });
    });
  }, []);

  const respond = useCallback(
    (confirmed: boolean) => {
      if (!request) return;
      request.resolve(confirmed);
      setRequest(null);
    },
    [request]
  );

  // Escape cancels, matching the expectation set by native dialogs.
  useEffect(() => {
    if (!request) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') respond(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [request, respond]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/70"
            onClick={() => respond(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-md border border-ink bg-cream p-6 shadow-hard"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">
              Confirm action
            </p>
            <h2 id={titleId} className="mt-2 font-display text-3xl uppercase leading-none">
              {request.options.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/70">
              {request.options.message}
            </p>

            <div className="mt-8 flex flex-col gap-3 border-t border-ink/20 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => respond(false)}
                className={buttonStyles({ variant: 'secondary' })}
              >
                {request.options.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => respond(true)}
                className={buttonStyles({
                  variant: request.options.destructive ? 'danger' : 'primary',
                })}
              >
                {request.options.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
