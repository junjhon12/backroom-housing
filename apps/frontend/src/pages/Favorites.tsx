import React, { useEffect, useState } from 'react';
import type { Property } from '../types/property';
import { fetchFavorites } from '../services/userService';
import PropertyCard from '../components/PropertyCard';

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
        setLoading(false);
      }
    };

    loadFavorites();

    return () => controller.abort();
  }, []);

  if (loading) return <div className="py-20 text-center animate-pulse text-slate-500">Loading saved listings...</div>;
  if (error) return <div className="py-20 text-center text-red-500 bg-red-50 rounded-lg border border-red-200 mt-8">Error: {error}</div>;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Saved Listings</h1>
        <p className="text-slate-600 mt-2">Your personally curated collection of properties.</p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 mb-4">You haven't saved any properties yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;