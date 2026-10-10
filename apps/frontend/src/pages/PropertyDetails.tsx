import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { fetchPropertyById } from '../services/propertyService';

// Explicitly type the URL parameters
type PropertyParams = {
  id: string;
};

const PropertyDetails: React.FC = () => {
  const { id } = useParams<PropertyParams>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const controller = new AbortController();

    const loadProperty = async () => {
      try {
        setLoading(true);
        const data = await fetchPropertyById(id, controller.signal);
        setProperty(data);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProperty();

    return () => {
      controller.abort();
    };
  }, [id]);

  if (loading) return <div className="py-20 text-center animate-pulse text-slate-500">Loading details...</div>;
  if (error) return <div className="py-20 text-center text-red-500">{error}</div>;
  if (!property) return <div className="py-20 text-center">Property not found.</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="p-8">
        <Link to="/" className="text-indigo-600 hover:underline mb-6 inline-block font-medium">&larr; Back to Listings</Link>
        
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-4xl font-bold text-slate-900">{property.title}</h1>
          <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold">
            {property.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
        
        <p className="text-slate-600 text-lg mb-8 leading-relaxed">{property.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-100">
          <div>
            <p className="text-sm text-slate-500 font-medium">Price</p>
            <p className="text-2xl font-bold text-indigo-600">${property.price.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Location</p>
            <p className="text-lg font-semibold text-slate-800">{property.location}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Layout</p>
            <p className="text-lg font-semibold text-slate-800">{property.bedrooms} Bed, {property.bathrooms} Bath</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Area</p>
            <p className="text-lg font-semibold text-slate-800">{property.squareFeet.toLocaleString()} sqft</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;