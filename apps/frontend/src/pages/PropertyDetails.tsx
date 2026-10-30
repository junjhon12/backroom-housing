import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { fetchPropertyById } from '../services/propertyService';
import { fetchFavorites, toggleFavoriteListing } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Badge, Button, buttonStyles, Card, Skeleton } from '../components/ui';

type PropertyParams = {
  id: string;
};

const PropertyDetails: React.FC = () => {
  const { id } = useParams<PropertyParams>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Favorites State
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        // Execute both fetches concurrently for performance
        const propertyPromise = fetchPropertyById(id, controller.signal);

        // Only fetch favorites if the user is logged in
        let favoritesPromise = Promise.resolve([] as Property[]);
        if (user) {
          favoritesPromise = fetchFavorites(controller.signal);
        }

        const [fetchedProperty, userFavorites] = await Promise.all([propertyPromise, favoritesPromise]);

        setProperty(fetchedProperty);

        // Determine if this property is already in the user's favorites
        if (user && userFavorites.some((fav) => fav._id === id)) {
          setIsFavorited(true);
        }

        setError(null);
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
  }, [id, user]);

  const handleToggleFavorite = async () => {
    if (!id || !user || isToggling) return;

    // Optimistic UI update
    setIsFavorited((prev) => !prev);
    setIsToggling(true);

    try {
      await toggleFavoriteListing(id);
      showToast(isFavorited ? 'Removed from saved listings' : 'Saved to favorites', 'success');
    } catch (err) {
      // Revert state on failure
      setIsFavorited((prev) => !prev);
      showToast(err instanceof Error ? err.message : 'Failed to save property', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  if (loading) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <Skeleton className="h-72 w-full border-b border-ink" />
        <div className="space-y-4 p-8">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-xl border border-magenta bg-magenta/10 px-5 py-4 text-sm text-magenta"
      >
        {error}
      </div>
    );
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-xl border border-ink bg-cream px-6 py-16 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">Not on file</p>
        <p className="mt-3 font-display text-3xl uppercase leading-none">Property not found</p>
        <Link to="/" className={`${buttonStyles({ variant: 'secondary' })} mt-6`}>
          Back to listings
        </Link>
      </div>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <div className="h-72 w-full border-b border-ink bg-paper-deep md:h-96">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-ink/50">
            No image on file
          </div>
        )}
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="text-[10px] uppercase tracking-[0.18em] text-ink/60 underline underline-offset-4 hover:text-ink"
          >
            &larr; Back to listings
          </Link>
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
            Ref {property._id.slice(-4).toUpperCase()}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-5 border-b border-ink/20 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant={property.isAvailable ? 'moss' : 'outline'}>
              {property.isAvailable ? 'Available' : 'Unavailable'}
            </Badge>
            <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] md:text-5xl">
              {property.title}
            </h1>
            <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-ink/60">
              {property.location}
            </p>
          </div>

          {/* Favorite action: authenticated users can toggle, guests are pointed at sign-in */}
          {user ? (
            <Button
              type="button"
              variant={isFavorited ? 'danger' : 'secondary'}
              onClick={handleToggleFavorite}
              disabled={isToggling}
              aria-pressed={isFavorited}
              className="shrink-0"
            >
              {isFavorited ? 'Saved' : 'Save listing'}
            </Button>
          ) : (
            <Link
              to="/login"
              state={{ from: `/property/${property._id}` }}
              className={buttonStyles({ variant: 'secondary', className: 'shrink-0' })}
            >
              Sign in to save
            </Link>
          )}
        </div>

        <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
          {property.description}
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-px border border-ink/20 bg-ink/20 md:grid-cols-4">
          <div className="bg-cream p-4">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/60">Price</dt>
            <dd className="mt-2 font-display text-2xl leading-none">
              ${property.price.toLocaleString()}
            </dd>
          </div>
          <div className="bg-cream p-4">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/60">Location</dt>
            <dd className="mt-2 text-sm leading-relaxed">{property.location}</dd>
          </div>
          <div className="bg-cream p-4">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/60">Layout</dt>
            <dd className="mt-2 text-sm leading-relaxed">
              {property.bedrooms} bd / {property.bathrooms} ba
            </dd>
          </div>
          <div className="bg-cream p-4">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/60">Area</dt>
            <dd className="mt-2 text-sm leading-relaxed">
              {property.squareFeet.toLocaleString()} sq ft
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
};

export default PropertyDetails;
