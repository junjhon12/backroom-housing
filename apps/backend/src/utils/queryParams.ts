import { AppError } from './AppError';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse an optional non-negative numeric query parameter. Rejects arrays and
 * non-numeric values with a 400 instead of letting `Number()` produce NaN and
 * surface as a Mongoose CastError (which used to look like a server fault).
 */
export const parseOptionalNumber = (value: unknown, field: string): number | undefined => {
  if (value === undefined) return undefined;

  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, `${field} must be a number`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(400, `${field} must be a non-negative number`);
  }

  return parsed;
};

const parsePositiveInteger = (value: unknown, field: string, fallback: number): number => {
  if (value === undefined) return fallback;

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new AppError(400, `${field} must be a positive integer`);
  }

  const parsed = Number(value);

  if (parsed < 1) {
    throw new AppError(400, `${field} must be a positive integer`);
  }

  return parsed;
};

export const parsePagination = (query: Record<string, unknown>): { page: number; limit: number } => {
  const page = parsePositiveInteger(query.page, 'page', 1);
  const requestedLimit = parsePositiveInteger(query.limit, 'limit', DEFAULT_LIMIT);

  // Clamp rather than reject: a large limit is a client preference, not an error,
  // but the server still decides how much it is willing to return.
  return { page, limit: Math.min(requestedLimit, MAX_LIMIT) };
};
