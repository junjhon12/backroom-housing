import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MapPage from './MapPage';
import type { Property } from '../types/property';
import { fetchProperties } from '../services/propertyService';

// Leaflet needs a real layout engine; the chart itself is covered by levelMap.test.
vi.mock('../components/LevelMap', () => ({
  default: ({ placements, selectedId }: { placements: unknown[]; selectedId: string | null }) => (
    <div data-testid="chart" data-pins={placements.length} data-selected={selectedId ?? ''} />
  ),
}));

vi.mock('../services/propertyService', () => ({ fetchProperties: vi.fn() }));

const make = (id: string, level: string, title: string): Property => ({
  _id: id,
  title,
  description: 'd',
  price: 1200,
  level,
  sector: 'Sector A-3',
  hazardClass: 'caution',
  bedrooms: 1,
  bathrooms: 1,
  squareFeet: 400,
  isAvailable: true,
  images: [],
  host: 'h',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <MapPage />
    </MemoryRouter>
  );

describe('MapPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('pins every listing and groups the file list by level', async () => {
    vi.mocked(fetchProperties).mockResolvedValue({
      properties: [make('1', 'Level 0', 'Lobby Unit'), make('2', 'Level 37', 'Pool Unit')],
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });

    renderPage();

    expect(await screen.findByTestId('chart')).toHaveAttribute('data-pins', '2');
    expect(screen.getByText(/Level 0 · The Lobby/)).toBeInTheDocument();
    expect(screen.getByText(/Level 37 · Poolrooms/)).toBeInTheDocument();
  });

  it('selects a file from the list and links to it', async () => {
    vi.mocked(fetchProperties).mockResolvedValue({
      properties: [make('abc', 'Level 1', 'Habitable Quarters')],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /Habitable Quarters/ }));

    expect(screen.getByTestId('chart')).toHaveAttribute('data-selected', 'abc');
    expect(screen.getByRole('link', { name: /open file/i })).toHaveAttribute(
      'href',
      '/property/abc'
    );
  });

  it('says so when the chart is truncated', async () => {
    vi.mocked(fetchProperties).mockResolvedValue({
      properties: [make('1', 'Level 0', 'A')],
      meta: { page: 1, limit: 100, total: 250, totalPages: 3 },
    });

    renderPage();

    expect(await screen.findByText(/Showing 1 of 250 files/)).toBeInTheDocument();
  });

  it('shows the error when the registry is unreachable', async () => {
    vi.mocked(fetchProperties).mockRejectedValue(new Error('The registry is unreachable.'));

    renderPage();

    await waitFor(() => expect(screen.getByText('Chart unavailable')).toBeInTheDocument());
    expect(screen.getByText('The registry is unreachable.')).toBeInTheDocument();
  });
});
