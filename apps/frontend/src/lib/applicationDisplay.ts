import type { BadgeVariant } from '../components/ui';
import type { ApplicationStatus } from '../types/application';

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; variant: BadgeVariant }
> = {
  pending: { label: 'Pending review', variant: 'outline' },
  accepted: { label: 'Accepted', variant: 'moss' },
  declined: { label: 'Declined', variant: 'signal' },
  withdrawn: { label: 'Withdrawn', variant: 'default' },
};

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

/** Timestamps are moments in time, so they render in the viewer's timezone. */
export const formatAppliedDate = (value: string): string =>
  new Date(value).toLocaleDateString(undefined, DATE_FORMAT);

/**
 * Move-in dates are calendar days, not instants. The API stores them at UTC
 * midnight, so formatting them in local time would show the previous day for
 * anyone west of UTC.
 */
export const formatCalendarDate = (value: string): string =>
  new Date(value).toLocaleDateString(undefined, { ...DATE_FORMAT, timeZone: 'UTC' });
