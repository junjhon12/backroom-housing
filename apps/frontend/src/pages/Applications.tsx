import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Application } from '../types/application';
import { fetchMyApplications, withdrawApplication } from '../services/applicationService';
import { useConfirm } from '../components/ConfirmProvider';
import { useToast } from '../components/ToastProvider';
import { Badge, Button, buttonStyles, EmptyState, Skeleton } from '../components/ui';
import { PropertyImage } from '../components/PropertyImage';
import {
  APPLICATION_STATUS_META,
  formatAppliedDate,
  formatCalendarDate,
} from '../lib/applicationDisplay';

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const confirm = useConfirm();
  const { showToast } = useToast();

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setApplications(await fetchMyApplications(controller.signal));
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const handleWithdraw = async (application: Application) => {
    const confirmed = await confirm({
      title: 'Withdraw application',
      message: `Withdraw your application for “${application.property?.title ?? 'this unit'}”?`,
      confirmLabel: 'Withdraw',
      destructive: true,
    });
    if (!confirmed) return;

    setBusyId(application._id);
    try {
      const updated = await withdrawApplication(application._id);
      setApplications((previous) =>
        previous.map((entry) => (entry._id === updated._id ? updated : entry))
      );
      showToast('Application withdrawn', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'The application could not be withdrawn', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-ink pb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">005 — Applicant file</p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-none md:text-5xl">
          Your applications
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/70">
          Every unit you have applied for, and where the host has left it. Withdrawn files stay on
          record but cannot be reviewed.
        </p>
      </header>

      {loading ? (
        <div className="border border-ink bg-cream">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-3 border-b border-ink/20 p-5 last:border-b-0">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="border border-signal bg-signal/10 px-5 py-4 text-sm text-signal">
          {error}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications on file"
          description="Browse the directory and file an application for a unit that suits you."
          action={
            <Link to="/" className={buttonStyles({ variant: 'secondary' })}>
              Browse the directory
            </Link>
          }
        />
      ) : (
        <ul className="border border-ink bg-cream">
          {applications.map((application) => {
            const property = application.property;
            const status = APPLICATION_STATUS_META[application.status];

            return (
              <li
                key={application._id}
                className="flex flex-col gap-4 border-b border-ink/20 p-5 last:border-b-0 md:flex-row md:items-start md:justify-between"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="hidden h-16 w-20 shrink-0 border border-ink/30 bg-paper-deep sm:block">
                    <PropertyImage
                      src={property?.images?.[0]}
                      alt=""
                      compact
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
                        Filed {formatAppliedDate(application.createdAt)}
                      </span>
                    </div>

                    {property ? (
                      <Link
                        to={`/property/${property._id}`}
                        className="mt-2 block font-display text-2xl uppercase leading-none hover:text-signal"
                      >
                        {property.title}
                      </Link>
                    ) : (
                      <p className="mt-2 font-display text-2xl uppercase leading-none text-ink/60">
                        Unit withdrawn from registry
                      </p>
                    )}

                    {property && (
                      <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink/60">
                        {property.level} · {property.sector}
                      </p>
                    )}

                    <p className="mt-3 max-w-xl whitespace-pre-wrap text-sm leading-relaxed text-ink/75">
                      {application.message}
                    </p>

                    {application.moveInDate && (
                      <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-ink/60">
                        Requested move-in {formatCalendarDate(application.moveInDate)}
                      </p>
                    )}
                  </div>
                </div>

                {(application.status === 'pending' || application.status === 'accepted') && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    disabled={busyId === application._id}
                    onClick={() => handleWithdraw(application)}
                  >
                    {busyId === application._id ? 'Withdrawing…' : 'Withdraw'}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Applications;
