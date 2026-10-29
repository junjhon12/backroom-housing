import React, { useEffect, useState } from 'react';
import type { Property, PaginationMeta } from '../types/property';
import { fetchProperties } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';

const Home: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search Form State
  const [keyword, setKeyword] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [bedrooms, setBedrooms] = useState<string>('');
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const controller = new AbortController();

    const loadProperties = async () => {
      try {
        setLoading(true);

        // Pagination is server-driven, so it has to travel with the filters.
        const params = new URLSearchParams(activeQuery);
        params.set('page', String(page));

        const result = await fetchProperties(params.toString(), controller.signal);
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
  }, [activeQuery, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct clean URL query string without empty parameters
    const params = new URLSearchParams();
    if (keyword.trim()) params.append('keyword', keyword.trim());
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (bedrooms) params.append('bedrooms', bedrooms);
    
    // New criteria always start from the first page.
    setPage(1);
    setActiveQuery(params.toString());
  };

  const handleClear = () => {
    setKeyword('');
    setMaxPrice('');
    setBedrooms('');
    setPage(1);
    setActiveQuery('');
  };

  return (
    <div className="space-y-8 mt-4">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-slate-900">Explore Listings</h1>
        <p className="text-slate-600 mt-2">Find your next space in the Backroom ecosystem.</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Search by title or city..." 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="grow p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <input 
            type="number" 
            placeholder="Max Price ($)" 
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full md:w-40 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <select 
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full md:w-40 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">Any Beds</option>
            <option value="1">1+ Bedrooms</option>
            <option value="2">2+ Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
          </select>
          <div className="flex gap-2 w-full md:w-auto">
            <button type="submit" className="grow md:grow-0 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              Search
            </button>
            {activeQuery && (
              <button type="button" onClick={handleClear} className="px-4 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors">
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-lg animate-pulse">Searching properties...</div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 bg-red-50 rounded-lg border border-red-200">Error: {error}</div>
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
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
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
                onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
