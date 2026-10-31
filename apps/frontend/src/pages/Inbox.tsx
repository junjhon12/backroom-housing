import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Application, ApplicationStatus } from '../types/application';
import { fetchReceivedApplications, respondToApplication } from '../services/applicationService';
import { useToast } from '../components/ToastProvider';
import { Badge, Button, EmptyState, Skeleton } from '../components/ui';
import {
  APPLICATION_STATUS_META,
  formatAppliedDate,
  formatCalendarDate,
} from '../lib/applicationDisplay';

type StatusResponse = Extract<ApplicationStatus, 'accepted' | 'declined'>;

const Inbox: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setApplications(await fetchReceivedApplications(controller.signal));
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

  const decided = async (application: Application, status: StatusResponse) => {
    setBusyId(application._id);
    try {
      const updated = await respondToApplication(application._id, status);
      setApplications((previous) =>
        previous.map((entry) => (entry._id === updated._id ? updated : entry))
      );
      showToast(
        status === 'accepted' ? 'Application accepted' : 'Application declined',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'The application could not be updated', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = applications.filter((application) => application.status === 'pending').length;
  const visible =
    filter === 'pending'
      ? applications.filter((application) => application.status === 'pending')
      : applications;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-ink pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">006 — Host inbox</p>
          <h1 className="mt-2 font-display text-4xl uppercase leading-none md:text-5xl">
            Incoming applications
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/70">
            Review applicants for the units you have registered. Accepted and declined files stay
            on record.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={filter === 'pending' ? 'primary' : 'secondary'}
            aria-pressed={filter === 'pending'}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === 'all' ? 'primary' : 'secondary'}
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All ({applications.length})
          </Button>
        </div>
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
      ) : visible.length === 0 ? (
        <EmptyState
          title={filter === 'pending' ? 'No pending applications' : 'Inbox empty'}
          description={
            filter === 'pending' && applications.length > 0
              ? 'Every application has been reviewed. Switch to All to see the record.'
              : 'When an applicant files for one of your units, the file will appear here.'
          }
          action={
            filter === 'pending' && applications.length > 0 ? (
              <Button type="button" variant="secondary" onClick={() => setFilter('all')}>
                View all applications
              </Button>
            ) : (
              <Link to="/dashboard" className="text-sm underline underline-offset-4">
                Back to the host console
              </Link>
            )
          }
        />
      ) : (
        <ul className="border border-ink bg-cream">
          {visible.map((application) => {
            const status = APPLICATION_STATUS_META[application.status];
            const property = application.property;
            const applicant = application.applicant;

            return (
              <li
                key={application._id}
                className="flex flex-col gap-4 border-b border-ink/20 p-5 last:border-b-0 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
                      Filed {formatAppliedDate(application.createdAt)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm">
                    <span className="font-medium">{applicant?.name ?? 'Applicant'}</span>
                    {applicant?.email && (
                      <>
                        {' · '}
                        <a
                          href={`mailto:${applicant.email}`}
                          className="underline underline-offset-4 hover:text-signal"
                        >
                          {applicant.email}
                        </a>
                      </>
                    )}
                  </p>

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
                      {property.level} · {property.sector} · ${property.price.toLocaleString()}/mo
                    </p>
                  )}

                  <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-ink/75">
                    {application.message}
                  </p>

                  {application.moveInDate && (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-ink/60">
                      Requested move-in {formatCalendarDate(application.moveInDate)}
                    </p>
                  )}
                </div>

                {application.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId === application._id}
                      onClick={() => decided(application, 'accepted')}
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={busyId === application._id}
                      onClick={() => decided(application, 'declined')}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Inbox;
