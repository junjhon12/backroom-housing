import { useState, type FC, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { submitApplication } from '../services/applicationService';
import { useToast } from './ToastProvider';
import { Button, Field, Input, Textarea } from './ui';

// The form only needs a sane lower bound for the date picker; evaluating this
// once avoids calling Date during render.
const MIN_MOVE_IN_DATE = new Date().toISOString().slice(0, 10);

interface ApplyFormProps {
  propertyId: string;
  hasApplied: boolean;
  onSubmitted: () => void;
}

export const ApplyForm: FC<ApplyFormProps> = ({ propertyId, hasApplied, onSubmitted }) => {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasApplied) {
    return (
      <div className="mt-6 border border-moss bg-moss/15 px-4 py-3 text-sm">
        <p className="font-medium">Application on file.</p>
        <p className="mt-1 text-ink/70">
          The host has been notified.{' '}
          <Link to="/applications" className="underline underline-offset-4">
            Track its status
          </Link>
          .
        </p>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await submitApplication({
        propertyId,
        message,
        ...(moveInDate ? { moveInDate } : {}),
      });
      showToast('Application filed', 'success');
      setOpen(false);
      setMessage('');
      setMoveInDate('');
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The application could not be filed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border border-ink/25 bg-paper-deep/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/65">Residency intake</p>
          <p className="mt-1 text-sm text-ink/75">
            Submit a short file note. The host reviews every application.
          </p>
        </div>

        {!open && (
          <Button type="button" onClick={() => setOpen(true)}>
            Apply for residency
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-ink/20 pt-4">
          <Field label="Why this unit?" htmlFor="application-message">
            <Textarea
              id="application-message"
              required
              maxLength={1000}
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe your household, your timeline, and anything the host should know."
            />
          </Field>

          <Field label="Requested move-in" htmlFor="application-move-in" hint="Optional">
            <Input
              id="application-move-in"
              type="date"
              value={moveInDate}
              min={MIN_MOVE_IN_DATE}
              onChange={(event) => setMoveInDate(event.target.value)}
            />
          </Field>

          {error && (
            <p role="alert" className="border border-signal bg-signal/10 px-3 py-2 text-sm text-signal">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Filing…' : 'File application'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
