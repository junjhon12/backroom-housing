import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { fetchMyProperties, deletePropertyListing } from '../services/propertyService';
import { useConfirm } from '../components/ConfirmProvider';
import { useToast } from '../components/ToastProvider';
import { Badge, Button, buttonStyles, EmptyState, Skeleton } from '../components/ui';

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
      title: 'Delete listing',
      message: 'This permanently removes the listing and its image. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });

    if (!confirmed) return;

    try {
      await deletePropertyListing(id);
      // Optimistic UI Update: Filter out the deleted property without reloading
      setProperties((prev) => prev.filter((p) => p._id !== id));
      showToast('Listing deleted', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete listing', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-ink pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">004 — Host console</p>
          <h1 className="mt-2 font-display text-4xl uppercase leading-none md:text-5xl">
            Your listings
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/70">
            Manage the units you have filed with Backroom Housing.
          </p>
        </div>

        <Link to="/property/new" className={buttonStyles()}>
          New listing
        </Link>
      </header>

      {loading ? (
        <div className="border border-ink bg-cream">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 border-b border-ink/20 p-5 last:border-b-0"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="border border-magenta bg-magenta/10 px-5 py-4 text-sm text-magenta"
        >
          {error}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          title="No listings on file"
          description="You have not filed any units yet. Create your first listing to make it available for review."
          action={
            <Link to="/property/new" className={buttonStyles({ variant: 'secondary' })}>
              Create a listing
            </Link>
          }
        />
      ) : (
        <ul className="border border-ink bg-cream">
          {properties.map((property) => (
            <li
              key={property._id}
              className="flex flex-col gap-4 border-b border-ink/20 p-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
                    Ref {property._id.slice(-4).toUpperCase()}
                  </span>
                  <Badge variant={property.isAvailable ? 'moss' : 'outline'}>
                    {property.isAvailable ? 'Active' : 'Hidden'}
                  </Badge>
                </div>

                <Link
                  to={`/property/${property._id}`}
                  className="mt-2 block font-display text-2xl uppercase leading-none hover:text-magenta"
                >
                  {property.title}
                </Link>

                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink/60">
                  ${property.price.toLocaleString()} · {property.location} ·{' '}
                  {property.bedrooms} bd / {property.bathrooms} ba
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  to={`/property/edit/${property._id}`}
                  className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                >
                  Edit
                </Link>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(property._id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
