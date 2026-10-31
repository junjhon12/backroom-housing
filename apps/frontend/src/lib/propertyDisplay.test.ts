import { describe, expect, it } from 'vitest';
import { HAZARD_META, formatArea, formatRent } from './propertyDisplay';

describe('formatRent', () => {
  it('formats whole dollars with thousands separators', () => {
    expect(formatRent(1450)).toBe('$1,450');
    expect(formatRent(3200)).toBe('$3,200');
    expect(formatRent(0)).toBe('$0');
  });
});

describe('formatArea', () => {
  it('appends the unit', () => {
    expect(formatArea(620)).toBe('620 sq ft');
    expect(formatArea(1400)).toBe('1,400 sq ft');
  });
});

describe('HAZARD_META', () => {
  it('maps every hazard class to a distinct label', () => {
    expect(HAZARD_META.safe).toMatchObject({ label: 'Safe', variant: 'moss' });
    expect(HAZARD_META.caution).toMatchObject({ label: 'Caution', variant: 'outline' });
    expect(HAZARD_META.hostile).toMatchObject({ label: 'Hostile', variant: 'signal' });
  });
});
