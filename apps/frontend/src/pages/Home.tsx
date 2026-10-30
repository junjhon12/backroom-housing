import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Property, PaginationMeta } from '../types/property';
import { fetchProperties } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';

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
    <div className="space-y-8 mt-4">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-slate-900">Explore Listings</h1>
        <p className="text-slate-600 mt-2">Find your next space in the Backroom ecosystem.</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="grow">
            <label htmlFor="search-keyword" className="sr-only">
              Search by title or city
            </label>
            <input
              id="search-keyword"
              type="text"
              placeholder="Search by title or city..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="w-full md:w-40">
            <label htmlFor="search-max-price" className="sr-only">
              Maximum price
            </label>
            <input
              id="search-max-price"
              type="number"
              placeholder="Max Price ($)"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="w-full md:w-40">
            <label htmlFor="search-bedrooms" className="sr-only">
              Minimum bedrooms
            </label>
            <select
              id="search-bedrooms"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="">Any Beds</option>
              <option value="1">1+ Bedrooms</option>
              <option value="2">2+ Bedrooms</option>
              <option value="3">3+ Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
            </select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="submit"
              className="grow md:grow-0 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
            {queryString && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Announced to screen readers without re-reading the whole grid */}
      <p className="sr-only" role="status">
        {resultSummary}
      </p>

      {/* Results Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-lg animate-pulse">Searching properties...</div>
      ) : error ? (
        <div role="alert" className="text-center py-20 text-red-500 bg-red-50 rounded-lg border border-red-200">
          Error: {error}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-300 rounded-xl">
          No properties found matching your criteria.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <nav aria-label="Search results pages" className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
