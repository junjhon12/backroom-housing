import React from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../types/property';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow flex flex-col">
      {/* New Image Container */}
      <div className="h-48 w-full bg-slate-100 border-b border-slate-200 relative">
        {property.imageUrl ? (
          <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-slate-400 font-medium">
            No Image Provided
          </div>
        )}
      </div>

      <div className="p-6 grow">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-slate-800">{property.title}</h2>
        </div>
        <p className="text-slate-600 mb-4 line-clamp-2">{property.description}</p>
        <div className="text-2xl font-bold text-indigo-600 mb-4">
          ${property.price.toLocaleString()}
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
          <span>{property.bedrooms} Beds</span>
          <span>&bull;</span>
          <span>{property.bathrooms} Baths</span>
        </div>
      </div>
      <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto flex justify-between items-center">
        <span className="text-sm text-slate-500 truncate mr-4">📍 {property.location}</span>
        <Link 
          to={`/property/${property._id}`} 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;