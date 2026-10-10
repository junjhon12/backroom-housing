import React, { useEffect, useState } from 'react';
import type { Property } from '../types/property';
import { fetchProperties } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';

const Home: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProperties = async () => {
      try {
        setLoading(true);
        const data = await fetchProperties(controller.signal);
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

    loadProperties();

    // Cleanup function prevents memory leaks if component unmounts
    return () => {
      controller.abort();
    };
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-slate-500 text-lg animate-pulse">Loading properties...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500 bg-red-50 rounded-lg border border-red-200">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Latest Listings</h1>
        <p className="text-slate-600 mt-2">Find your next space in the Backroom ecosystem.</p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-300 rounded-xl">
          No properties available yet.
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

export default Home;