import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { fetchMyProperties, deletePropertyListing } from '../services/propertyService';
import { useConfirm } from '../components/ConfirmProvider';
import { useToast } from '../components/ToastProvider';
import { Badge, Button, buttonStyles, EmptyState, Skeleton } from '../components/ui';
import { HAZARD_META, formatRent } from '../lib/propertyDisplay';

const Dashboard: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const confirm = useConfirm();
  const { showToast } = useToast();

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        const data = await fetchMyProperties(controller.signal);
        setProperties(data);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => controller.abort();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Withdraw file',
      message: 'This permanently removes the unit and its photograph. This cannot be undone.',
      confirmLabel: 'Withdraw',
      destructive: true,
    });

    if (!confirmed) return;

    try {
      await deletePropertyListing(id);
      // Optimistic UI Update: Filter out the deleted property without reloading
      setProperties((prev) => prev.filter((p) => p._id !== id));
      showToast('File withdrawn', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to withdraw file', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-ink pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">004 — Host console</p>
          <h1 className="mt-2 font-display text-4xl uppercase leading-none md:text-5xl">
            Filed units
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/70">
            Manage the units you have registered with the Registry. Withdrawn files leave the
            public directory immediately.
          </p>
        </div>

        <Link to="/property/new" className={buttonStyles()}>
          Register a unit
        </Link>
      </header>

      {loading ? (
        <div className="border border-ink bg-cream">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3 border-b border-ink/20 p-5 last:border-b-0">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="border border-signal bg-signal/10 px-5 py-4 text-sm text-signal"
        >
          {error}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          title="No files on record"
          description="You have not registered any units. File your first listing to release it to the directory."
          action={
            <Link to="/property/new" className={buttonStyles({ variant: 'secondary' })}>
              Register a unit
            </Link>
          }
        />
      ) : (
        <ul className="border border-ink bg-cream">
          {properties.map((property) => {
            const hazard = HAZARD_META[property.hazardClass] ?? HAZARD_META.safe;

            return (
              <li
                key={property._id}
                className="flex flex-col gap-4 border-b border-ink/20 p-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-ink/65">
                      Ref {property._id.slice(-4).toUpperCase()}
                    </span>
                    <Badge variant={hazard.variant}>{hazard.label}</Badge>
                    <Badge variant={property.isAvailable ? 'moss' : 'outline'}>
                      {property.isAvailable ? 'Open' : 'Withdrawn'}
                    </Badge>
                  </div>

                  <Link
                    to={`/property/${property._id}`}
                    className="mt-2 block font-display text-2xl uppercase leading-none hover:text-signal"
                  >
                    {property.title}
                  </Link>

                  <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink/60">
                    {property.level} · {property.sector} · {formatRent(property.price)}/mo ·{' '}
                    {property.bedrooms} bd / {property.bathrooms} ba
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/property/edit/${property._id}`}
                    className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                  >
                    Amend
                  </Link>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(property._id)}
                  >
                    Withdraw
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
