import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { buttonStyles } from './ui';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Without a boundary, any render error unmounts the whole tree and leaves a
 * blank page. This keeps the failure contained and gives the user a way out.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[UI] Unhandled render error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-paper p-6">
          <div className="w-full max-w-md border border-ink bg-cream p-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">
              System fault
            </p>
            <h1 className="mt-3 font-display text-4xl uppercase leading-none">
              Something went wrong
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ink/70">
              An unexpected error broke this page. Reloading usually fixes it.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`${buttonStyles()} mt-8`}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
