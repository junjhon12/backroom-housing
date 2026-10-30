import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { fetchPropertyById } from '../services/propertyService';
import { fetchFavorites, toggleFavoriteListing } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';

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
        if (user && userFavorites.some(fav => fav._id === id)) {
          setIsFavorited(true);
        }
        
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => controller.abort();
  }, [id, user]);

  const handleToggleFavorite = async () => {
    if (!id || !user || isToggling) return;
    
    // Optimistic UI update
    setIsFavorited(prev => !prev);
    setIsToggling(true);

    try {
      await toggleFavoriteListing(id);
      showToast(isFavorited ? 'Removed from saved listings' : 'Saved to favorites', 'success');
    } catch (err) {
      // Revert state on failure
      setIsFavorited(prev => !prev);
      showToast(err instanceof Error ? err.message : 'Failed to save property', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  if (loading) return <div className="py-20 text-center animate-pulse text-slate-500">Loading details...</div>;
  if (error) return <div className="py-20 text-center text-red-500">{error}</div>;
  if (!property) return <div className="py-20 text-center">Property not found.</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      {property.imageUrl && (
        <div className="w-full h-96 bg-slate-100 border-b border-slate-200">
          <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-8">
        <Link to="/" className="text-indigo-600 hover:underline mb-6 inline-block font-medium">&larr; Back to Listings</Link>
        
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">{property.title}</h1>
            <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold mt-3 inline-block">
              {property.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>

          {/* Conditional Favorite Button for Authenticated Users */}
          {user && (
            <button 
              onClick={handleToggleFavorite}
              disabled={isToggling}
              aria-pressed={isFavorited}
              className={`px-6 py-2.5 rounded-lg font-bold transition-all border-2 ${
                isFavorited 
                  ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-600 hover:text-indigo-600'
              }`}
            >
              {isFavorited ? '♥ Saved' : '♡ Save to Favorites'}
            </button>
          )}
        </div>
        
        <p className="text-slate-600 text-lg mb-8 leading-relaxed whitespace-pre-wrap">{property.description}</p>
        
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