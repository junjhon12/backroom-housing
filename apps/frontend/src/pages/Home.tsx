import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Property, PaginationMeta } from '../types/property';
import { fetchProperties } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';
import { Button, EmptyState, Field, Input, Select, Skeleton } from '../components/ui';

const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();

  // Filters live in the URL, so a search is shareable and the back button works.
  const keywordParam = searchParams.get('keyword') ?? '';
  const maxPriceParam = searchParams.get('maxPrice') ?? '';
  const bedroomsParam = searchParams.get('bedrooms') ?? '';
  const pageParam = Number(searchParams.get('page'));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const [properties, setProperties] = useState<Property[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Draft form state, kept separate so typing doesn't trigger a request.
  const [keyword, setKeyword] = useState<string>(keywordParam);
  const [maxPrice, setMaxPrice] = useState<string>(maxPriceParam);
  const [bedrooms, setBedrooms] = useState<string>(bedroomsParam);

  // Re-sync the form when the URL changes (back/forward, Clear, a shared link).
  useEffect(() => {
    setKeyword(keywordParam);
    setMaxPrice(maxPriceParam);
    setBedrooms(bedroomsParam);
  }, [keywordParam, maxPriceParam, bedroomsParam]);

  useEffect(() => {
    const controller = new AbortController();

    const loadProperties = async () => {
      try {
        setLoading(true);
        const result = await fetchProperties(queryString, controller.signal);
        setProperties(result.properties);
        setMeta(result.meta);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        // Don't touch state after the request was superseded or unmounted.
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProperties();

    return () => controller.abort();
  }, [queryString]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Construct a clean query string without empty parameters. Dropping `page`
    // resets new criteria to the first page.
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (bedrooms) params.set('bedrooms', bedrooms);

    setSearchParams(params);
  };

  const handleClear = () => {
    setSearchParams({});
  };

  const goToPage = (nextPage: number) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (nextPage <= 1) {
        next.delete('page');
      } else {
        next.set('page', String(nextPage));
      }
      return next;
    });
  };

  const resultSummary = loading
    ? 'Loading listings'
    : `${meta?.total ?? properties.length} listings found`;

  return (
    <div className="space-y-10">
      <header className="border-b border-ink pb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">001 — Availability</p>
        <h1 className="mt-3 font-display text-6xl uppercase leading-[0.85] md:text-8xl">
          Stable.
          <br />
          Quiet.
          <br />
          Yours.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink/70">
          Find your next space in the Backroom ecosystem. Every listing is verified, filed,
          and available for immediate review.
        </p>
      </header>

      {/* Search & Filter Bar */}
      <section className="border border-ink bg-cream p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">Filter listings</p>

        <form
          onSubmit={handleSearch}
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end"
        >
          <Field label="Keyword" htmlFor="search-keyword">
            <Input
              id="search-keyword"
              type="text"
              placeholder="Title, city, description"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Field>

          <Field label="Max price ($)" htmlFor="search-max-price">
            <Input
              id="search-max-price"
              type="number"
              min="0"
              placeholder="—"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </Field>

          <Field label="Bedrooms" htmlFor="search-bedrooms">
            <Select
              id="search-bedrooms"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </Select>
          </Field>

          <div className="flex gap-2">
            <Button type="submit">Search</Button>
            {queryString && (
              <Button type="button" variant="secondary" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
        </form>
      </section>

      {/* Announced to screen readers without re-reading the whole grid */}
      <p className="sr-only" role="status">
        {resultSummary}
      </p>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-ink/30 pb-2">
          <h2 className="font-display text-2xl uppercase leading-none">Listings</h2>
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
            {meta?.total ?? 0} results
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border border-ink bg-cream">
                <Skeleton className="h-48 w-full" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
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
            description="Nothing matches those criteria. Widen the price range or clear the filters."
            action={
              queryString ? (
                <Button type="button" variant="secondary" onClick={handleClear}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <nav
                aria-label="Search results pages"
                className="flex items-center justify-center gap-4 pt-2"
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
                  Page {meta.page} / {meta.totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= meta.totalPages}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Home;
