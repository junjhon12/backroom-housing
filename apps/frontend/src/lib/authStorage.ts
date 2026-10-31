import type { User } from '../types/auth';

export const AUTH_STORAGE_KEY = 'backroom_user';

/** Reads the JWT from the persisted session without throwing on bad JSON. */
export const readAuthToken = (): string | null => {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    const user = JSON.parse(storedUser) as Partial<User>;
    return typeof user.token === 'string' ? user.token : null;
  } catch {
    return null;
  }
};
