import React from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { Badge, buttonStyles } from './ui';
import { HAZARD_META, formatArea, formatRent } from '../lib/propertyDisplay';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const reference = property._id.slice(-4).toUpperCase();
  const hazard = HAZARD_META[property.hazardClass] ?? HAZARD_META.safe;

  return (
    <article className="flex flex-col border border-ink bg-cream">
      <div className="flex items-center justify-between gap-2 border-b border-ink/25 px-4 py-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
          File {reference}
        </span>
        <Badge variant={hazard.variant}>{hazard.label}</Badge>
      </div>

      <div className="relative h-44 w-full border-b border-ink/25 bg-paper-deep">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-ink/65">
            No photograph on file
          </div>
        )}

        <span className="absolute bottom-0 left-0 border-t border-r border-ink bg-paper px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
          {property.level}
        </span>
      </div>

      <div className="flex grow flex-col gap-3 p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
          {property.sector}
        </p>

        <h2 className="line-clamp-2 font-display text-2xl uppercase leading-[0.95]">
          {property.title}
        </h2>

        <p className="line-clamp-2 text-sm leading-relaxed text-ink/70">
          {property.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-ink/20 pt-4">
          <div>
            <p className="font-display text-2xl leading-none">
              {formatRent(property.price)}
              <span className="ml-1 font-mono text-[10px] tracking-[0.14em] text-ink/60">
                /MO
              </span>
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink/60">
              {property.bedrooms} bd / {property.bathrooms} ba · {formatArea(property.squareFeet)}
            </p>
          </div>

          <Link
            to={`/property/${property._id}`}
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
          >
            Open file
          </Link>
        </div>
      </div>
    </article>
  );
};

export default PropertyCard;
