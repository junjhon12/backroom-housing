import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PropertyCard from './PropertyCard';
import type { Property } from '../types/property';

const property: Property = {
  _id: '0123456789abcdef01234567',
  title: 'Habitable Zone Quarters',
  description: 'Proper walls, working lights, and a supply drop every eleven days.',
  price: 2100,
  level: 'Level 1',
  sector: 'Sector A-3',
  hazardClass: 'hostile',
  bedrooms: 2,
  bathrooms: 1,
  squareFeet: 900,
  isAvailable: true,
  images: ['/uploads/seed-01-00.svg'],
  host: 'fedcba987654321001234567',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('PropertyCard', () => {
  it('renders the listing facts and hazard classification', () => {
    render(
      <MemoryRouter>
        <PropertyCard property={property} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: property.title })).toBeInTheDocument();
    expect(screen.getByText('$2,100')).toBeInTheDocument();
    expect(screen.getByText(/2 bd \/ 1 ba/)).toBeInTheDocument();
    expect(screen.getByText('Hostile')).toBeInTheDocument();
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Sector A-3')).toBeInTheDocument();
  });

  it('links to the listing file', () => {
    render(
      <MemoryRouter>
        <PropertyCard property={property} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /open file/i })).toHaveAttribute(
      'href',
      `/property/${property._id}`
    );
  });

  it('shows the withheld-photograph treatment when there is no image', () => {
    render(
      <MemoryRouter>
        <PropertyCard property={{ ...property, images: [] }} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
