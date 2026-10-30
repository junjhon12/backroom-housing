import React from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { Badge, buttonStyles } from './ui';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const reference = property._id.slice(-4).toUpperCase();

  return (
    <article className="flex flex-col border border-ink bg-cream">
      <div className="h-48 w-full border-b border-ink bg-paper-deep">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-ink/50">
            No image on file
          </div>
        )}
      </div>

      <div className="flex grow flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
            Ref {reference}
          </span>
          <Badge variant={property.isAvailable ? 'moss' : 'outline'}>
            {property.isAvailable ? 'Available' : 'Unavailable'}
          </Badge>
        </div>

        <h2 className="font-display text-2xl uppercase leading-none">{property.title}</h2>

        <p className="line-clamp-2 text-sm leading-relaxed text-ink/70">
          {property.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-ink/20 pt-4">
          <div>
            <p className="font-display text-2xl leading-none">
              ${property.price.toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink/60">
              {property.bedrooms} bd / {property.bathrooms} ba
            </p>
          </div>
          <Link
            to={`/property/${property._id}`}
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
          >
            View
          </Link>
        </div>

        <p className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
          {property.location}
        </p>
      </div>
    </article>
  );
};

export default PropertyCard;
