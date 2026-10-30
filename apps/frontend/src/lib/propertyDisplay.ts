import type { BadgeVariant } from '../components/ui';
import type { HazardClass } from '../types/property';

/**
 * A listing's hazard classification drives the badge on cards and files.
 * Kept in one place so the label and tone never disagree.
 */
export const HAZARD_META: Record<HazardClass, { label: string; variant: BadgeVariant }> = {
  safe: { label: 'Safe', variant: 'moss' },
  caution: { label: 'Caution', variant: 'outline' },
  hostile: { label: 'Hostile', variant: 'signal' },
};

export const formatRent = (price: number): string => `$${price.toLocaleString()}`;

export const formatArea = (squareFeet: number): string => `${squareFeet.toLocaleString()} sq ft`;
