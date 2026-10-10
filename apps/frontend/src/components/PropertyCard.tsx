import React from 'react';
import type { Property } from '../types/property';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-slate-800">{property.title}</h2>
          <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-teal-200">
            {property.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
        <p className="text-slate-600 mb-4 line-clamp-2">{property.description}</p>
        <div className="text-2xl font-bold text-indigo-600 mb-4">
          ${property.price.toLocaleString()}
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-500">
          <span>{property.bedrooms} Beds</span>
          <span>&bull;</span>
          <span>{property.bathrooms} Baths</span>
          <span>&bull;</span>
          <span>{property.squareFeet.toLocaleString()} sqft</span>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
          📍 {property.location}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;