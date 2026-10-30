import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { fetchFavorites } from '../services/userService';
import PropertyCard from '../components/PropertyCard';
import { buttonStyles, EmptyState, Skeleton } from '../components/ui';

const Favorites: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadFavorites = async () => {
      try {
        setLoading(true);
        const data = await fetchFavorites(controller.signal);
        setProperties(data);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadFavorites();

    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-8">
      <header className="border-b border-ink pb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">005 — Saved folder</p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-none md:text-5xl">
          Saved files
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/70">
          Units you have flagged for a second look. Files are held until you release them.
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border border-ink bg-cream">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-44 w-full" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
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
          title="Nothing saved"
          description="You have not flagged any units. Browse the directory and save what fits."
          action={
            <Link to="/" className={buttonStyles({ variant: 'secondary' })}>
              Browse directory
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
