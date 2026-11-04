import { describe, expect, it } from 'vitest';
import type { Property } from '../types/property';
import {
  LEVELS,
  ROUTE,
  UNCHARTED,
  groupByRegion,
  levelKey,
  placeListings,
  regionFor,
} from './levelMap';

const make = (overrides: Partial<Property>): Property => ({
  _id: 'aaaa',
  title: 'Unit',
  description: 'Unit',
  price: 1000,
  level: 'Level 0',
  sector: 'Sector B-12',
  hazardClass: 'safe',
  bedrooms: 1,
  bathrooms: 1,
  squareFeet: 500,
  isAvailable: true,
  images: [],
  host: 'host',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const inside = (position: [number, number], area: { x: number; y: number; w: number; h: number }) =>
  position[1] >= area.x &&
  position[1] <= area.x + area.w &&
  position[0] >= area.y &&
  position[0] <= area.y + area.h;

describe('levelKey', () => {
  it('reads the level number', () => {
    expect(levelKey('Level 37')).toBe('37');
    expect(levelKey('level 0')).toBe('0');
    expect(levelKey('Level 011')).toBe('11');
  });

  it('returns null when there is no number', () => {
    expect(levelKey('Level !')).toBeNull();
    expect(levelKey('')).toBeNull();
  });
});

describe('regionFor', () => {
  it('maps charted levels and falls back to uncharted', () => {
    expect(regionFor('Level 4').name).toBe('Abandoned Offices');
    expect(regionFor('Level 404')).toBe(UNCHARTED);
    expect(regionFor('The Void')).toBe(UNCHARTED);
  });
});

describe('level layout', () => {
  it('has unique keys and non-overlapping regions', () => {
    expect(new Set(LEVELS.map((level) => level.key)).size).toBe(LEVELS.length);

    for (const a of LEVELS) {
      for (const b of LEVELS) {
        if (a === b) continue;
        const overlap =
          a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.label} overlaps ${b.label}`).toBe(false);
      }
    }
  });

  it('routes through every charted level', () => {
    expect(ROUTE).toHaveLength(LEVELS.length);
  });
});

describe('placeListings', () => {
  it('keeps each listing inside its level', () => {
    const placements = placeListings([
      make({ _id: '1', level: 'Level 0', sector: 'Sector B-12' }),
      make({ _id: '2', level: 'Level 37', sector: 'Sector 4' }),
      make({ _id: '3', level: 'Level 999', sector: 'Sector Z' }),
    ]);

    expect(placements).toHaveLength(3);
    for (const placement of placements) {
      expect(inside(placement.position, placement.region)).toBe(true);
    }
    expect(placements.find((p) => p.property._id === '3')?.region).toBe(UNCHARTED);
  });

  it('is deterministic regardless of input order', () => {
    const a = make({ _id: '1', sector: 'Sector A' });
    const b = make({ _id: '2', sector: 'Sector A' });

    const first = placeListings([a, b]);
    const second = placeListings([b, a]);

    const byId = (list: typeof first) =>
      Object.fromEntries(list.map((p) => [p.property._id, p.position]));
    expect(byId(second)).toEqual(byId(first));
  });

  it('separates units that share a sector', () => {
    const [one, two] = placeListings([
      make({ _id: '1', sector: 'Sector A' }),
      make({ _id: '2', sector: 'sector a ' }),
    ]);

    expect(one.position).not.toEqual(two.position);
  });

  it('puts different sectors in different places', () => {
    const [one, two] = placeListings([
      make({ _id: '1', sector: 'Sector B-12' }),
      make({ _id: '2', sector: 'Sector F-3' }),
    ]);

    expect(one.position).not.toEqual(two.position);
  });
});

describe('groupByRegion', () => {
  it('lists charted levels in survey order, then uncharted', () => {
    const groups = groupByRegion(
      placeListings([
        make({ _id: '1', level: 'Level 37' }),
        make({ _id: '2', level: 'Level 999' }),
        make({ _id: '3', level: 'Level 1' }),
      ])
    );

    expect(groups.map((group) => group.region.key)).toEqual(['1', '37', 'uncharted']);
  });
});
