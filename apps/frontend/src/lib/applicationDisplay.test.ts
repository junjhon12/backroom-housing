import { describe, expect, it } from 'vitest';
import {
  APPLICATION_STATUS_META,
  formatAppliedDate,
  formatCalendarDate,
} from './applicationDisplay';

describe('APPLICATION_STATUS_META', () => {
  it('gives every status a label and a distinct tone', () => {
    expect(APPLICATION_STATUS_META.pending).toMatchObject({ label: 'Pending review' });
    expect(APPLICATION_STATUS_META.accepted).toMatchObject({ label: 'Accepted', variant: 'moss' });
    expect(APPLICATION_STATUS_META.declined).toMatchObject({ label: 'Declined', variant: 'signal' });
    expect(APPLICATION_STATUS_META.withdrawn).toMatchObject({ label: 'Withdrawn' });
  });
});

describe('formatAppliedDate', () => {
  it('renders a readable date', () => {
    expect(formatAppliedDate('2026-03-04T12:00:00.000Z')).toMatch(/Mar.*4.*2026/);
  });
});

describe('formatCalendarDate', () => {
  it('keeps a UTC-midnight calendar day from slipping backwards', () => {
    expect(formatCalendarDate('2026-12-01T00:00:00.000Z')).toMatch(/Dec.*1.*2026/);
  });
});
