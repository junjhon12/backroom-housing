import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { fetchPropertyById } from '../services/propertyService';
import { fetchFavorites, toggleFavoriteListing } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Badge, Button, buttonStyles, Card, Skeleton, Stamp } from '../components/ui';
import { PropertyImage } from '../components/PropertyImage';
import { HAZARD_META, formatArea, formatRent } from '../lib/propertyDisplay';

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

  // Gallery: index into property.images.
  const [activeImage, setActiveImage] = useState<number>(0);

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

        const [fetchedProperty, userFavorites] = await Promise.all([
          propertyPromise,
          favoritesPromise,
        ]);

        setProperty(fetchedProperty);
        setActiveImage(0);

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
      showToast(isFavorited ? 'File removed from saved' : 'File saved to your folder', 'success');
    } catch (err) {
      // Revert state on failure
      setIsFavorited((prev) => !prev);
      showToast(err instanceof Error ? err.message : 'Failed to save file', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  if (loading) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <Skeleton className="h-9 w-full border-b border-ink" />
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
        className="mx-auto max-w-xl border border-signal bg-signal/10 px-5 py-4 text-sm text-signal"
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
          Return to the directory
        </Link>
      </div>
    );
  }

  const hazard = HAZARD_META[property.hazardClass] ?? HAZARD_META.safe;
  const images = property.images ?? [];
  const reference = property._id.slice(-4).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="text-[10px] uppercase tracking-[0.18em] text-ink/60 underline underline-offset-4 hover:text-ink"
        >
          &larr; Directory
        </Link>
        <Stamp>Inspected</Stamp>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/25 px-5 py-2.5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
            Property file · Ref {property._id.slice(-4).toUpperCase()}
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
            {property.isAvailable ? 'Open for transfer' : 'Withdrawn'}
          </span>
        </div>

        <div className="relative aspect-[16/10] w-full border-b border-ink bg-paper-deep">
          <PropertyImage
            src={images[activeImage]}
            alt={
              images.length > 1
                ? `${property.title} — photograph ${activeImage + 1} of ${images.length}`
                : property.title
            }
            reference={`Ref ${reference}`}
            eager
            className="h-full w-full object-cover"
          />

          {images.length > 1 && (
            <span className="absolute right-0 top-0 border-b border-l border-ink bg-paper px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
              {String(activeImage + 1).padStart(2, '0')} /{' '}
              {String(images.length).padStart(2, '0')}
            </span>
          )}

          <span className="absolute bottom-0 left-0 border-t border-r border-ink bg-paper px-3 py-1.5 text-[10px] uppercase tracking-[0.16em]">
            {property.level} · {property.sector}
          </span>
        </div>

        {images.length > 1 && (
          <ul className="grid grid-cols-4 gap-px border-b border-ink bg-ink/20">
            {images.map((url, index) => (
              <li key={url}>
                <button
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-pressed={index === activeImage}
                  aria-label={`Show photograph ${index + 1}`}
                  className={`relative block aspect-[4/3] w-full bg-paper-deep transition-opacity ${
                    index === activeImage ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-1 ${
                      index === activeImage ? 'bg-signal' : 'bg-transparent'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-5 border-b border-ink/20 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={hazard.variant}>{hazard.label}</Badge>
                <Badge variant={property.isAvailable ? 'default' : 'outline'}>
                  {property.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
              </div>

              <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] md:text-5xl">
                {property.title}
              </h1>

              <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-ink/60">
                {property.level} · {property.sector}
              </p>
            </div>

            {/* Save action: authenticated users can toggle, guests are pointed at intake */}
            {user ? (
              <Button
                type="button"
                variant={isFavorited ? 'danger' : 'secondary'}
                onClick={handleToggleFavorite}
                disabled={isToggling}
                aria-pressed={isFavorited}
                className="shrink-0"
              >
                {isFavorited ? 'Saved' : 'Save file'}
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

          <section className="mt-6" aria-labelledby="field-notes">
            <h2
              id="field-notes"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/65"
            >
              Field notes
            </h2>
            <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
              {property.description}
            </p>
          </section>

          <dl className="mt-8 grid grid-cols-2 gap-px border border-ink/20 bg-ink/20 md:grid-cols-3">
            <div className="bg-cream p-4">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/65">Rent</dt>
              <dd className="mt-2 font-display text-2xl leading-none">
                {formatRent(property.price)}
                <span className="ml-1 font-mono text-[10px] tracking-[0.14em] text-ink/60">
                  /MO
                </span>
              </dd>
            </div>
            <div className="bg-cream p-4">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/65">Level</dt>
              <dd className="mt-2 text-sm leading-relaxed">{property.level}</dd>
            </div>
            <div className="bg-cream p-4">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/65">Sector</dt>
              <dd className="mt-2 text-sm leading-relaxed">{property.sector}</dd>
            </div>
            <div className="bg-cream p-4">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/65">Layout</dt>
              <dd className="mt-2 text-sm leading-relaxed">
                {property.bedrooms} bd / {property.bathrooms} ba
              </dd>
            </div>
            <div className="bg-cream p-4">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/65">Area</dt>
              <dd className="mt-2 text-sm leading-relaxed">{formatArea(property.squareFeet)}</dd>
            </div>
            <div className="bg-cream p-4">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-ink/65">Status</dt>
              <dd className="mt-2 text-sm leading-relaxed">
                {property.isAvailable ? 'Open for transfer' : 'Withdrawn'}
              </dd>
            </div>
          </dl>

          <p className="mt-6 text-[10px] uppercase tracking-[0.16em] text-ink/60">
            Inspection reports available on request. Do not attempt to leave the premises.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PropertyDetails;
