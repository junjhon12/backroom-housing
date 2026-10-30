import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Property, PaginationMeta } from '../types/property';
import { fetchProperties } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';
import { Button, buttonStyles, EmptyState, Field, Input, Select, Skeleton } from '../components/ui';

const NOTICES = [
  'Do not trust the windows. There are no windows.',
  'Keep your entry card on your person at all times.',
  'Rent is due on the first of each cycle. Cycles are not standardised.',
  'Report unattended humming to your floor liaison.',
];

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
    ? 'Loading files'
    : `${meta?.total ?? properties.length} files found`;

  return (
    <div className="space-y-12">
      <header className="grid gap-8 border-b border-ink pb-10 lg:grid-cols-[1.55fr_1fr] lg:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-ink/60">
            Form 12-B · Residential placement
          </p>

          <h1 className="mt-4 font-display text-[3.5rem] uppercase leading-[0.82] sm:text-7xl md:text-8xl">
            The
            <br />
            Backrooms
            <br />
            are open.
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink/75">
            The Registry places vetted applicants in surveyed units across the known levels.
            Every file is inspected before it is released. No windows, no exits, no surprises.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#directory" className={buttonStyles()}>
              Browse directory
            </a>
            <Link to="/register" className={buttonStyles({ variant: 'secondary' })}>
              Apply for residency
            </Link>
          </div>
        </div>

        <aside className="border border-ink bg-cream">
          <div className="flex items-center justify-between border-b border-ink/25 px-4 py-2.5">
            <span className="text-[10px] uppercase tracking-[0.2em]">Notice to applicants</span>
            <span aria-hidden="true" className="h-2 w-2 bg-signal" />
          </div>

          <ol className="divide-y divide-ink/15">
            {NOTICES.map((notice, index) => (
              <li key={notice} className="flex gap-3 px-4 py-3 text-sm leading-relaxed text-ink/80">
                <span className="shrink-0 text-[10px] tracking-[0.14em] text-ink/65">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{notice}</span>
              </li>
            ))}
          </ol>
        </aside>
      </header>

      {/* Atmosphere band: sets the world without competing with the headline */}
      <figure className="relative -mx-4 border-y border-ink sm:mx-0 sm:border">
        <div className="aspect-[16/9] w-full sm:aspect-[21/9]">
          <img
            src="/scenes/corridor.svg"
            alt="A wallpaper corridor on Level 0 receding toward a single dark doorway"
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <figcaption className="absolute bottom-0 left-0 border-t border-r border-ink bg-paper px-3 py-1.5 text-[10px] uppercase tracking-[0.16em]">
          Level 0 · Corridor 12 · Photographed 1995
        </figcaption>
      </figure>

      {/* Intake filter */}
      <section className="border border-ink bg-cream p-5" aria-labelledby="filter-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="filter-heading" className="font-display text-xl uppercase leading-none">
            Intake filter
          </h2>
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink/65">
            Applies to all levels
          </span>
        </div>

        <form
          onSubmit={handleSearch}
          className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end"
        >
          <Field label="Keyword" htmlFor="search-keyword">
            <Input
              id="search-keyword"
              type="text"
              placeholder="Level, sector, title"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Field>

          <Field label="Max rent ($ / mo)" htmlFor="search-max-price">
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

      <section id="directory" className="scroll-mt-24 space-y-6" aria-labelledby="directory-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink pb-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink/65">001 — Directory</p>
            <h2 id="directory-heading" className="mt-1 font-display text-3xl uppercase leading-none">
              Available units
            </h2>
          </div>
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
            {meta?.total ?? 0} files open
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border border-ink bg-cream">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-44 w-full" />
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
            className="border border-signal bg-signal/10 px-5 py-4 text-sm text-signal"
          >
            {error}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            title="No units on file"
            description="Nothing matches those criteria. Widen the rent range or clear the filter."
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
