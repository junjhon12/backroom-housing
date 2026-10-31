import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import type { User } from '../types/auth';

const STORAGE_KEY = 'backroom_user';

const user: User = {
  _id: '0123456789abcdef01234567',
  name: 'Ada',
  email: 'ada@backroom.test',
  role: 'renter',
  token: 'signed-token',
};

const Probe = () => {
  const { user: current, login, logout } = useAuth();

  return (
    <div>
      <span data-testid="current-user">{current?.name ?? 'none'}</span>
      <button type="button" onClick={() => login(user)}>
        sign in
      </button>
      <button type="button" onClick={logout}>
        sign out
      </button>
    </div>
  );
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthProvider', () => {
  it('starts signed out when nothing is stored', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(screen.getByTestId('current-user')).toHaveTextContent('none');
  });

  it('hydrates the session synchronously from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(screen.getByTestId('current-user')).toHaveTextContent('Ada');
  });

  it('persists a sign-in and clears it on sign-out', async () => {
    const browser = userEvent.setup();

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await browser.click(screen.getByRole('button', { name: 'sign in' }));

    expect(screen.getByTestId('current-user')).toHaveTextContent('Ada');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      name: 'Ada',
    });

    await browser.click(screen.getByRole('button', { name: 'sign out' }));

    expect(screen.getByTestId('current-user')).toHaveTextContent('none');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('discards a corrupt stored session', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, '{not-json');

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(screen.getByTestId('current-user')).toHaveTextContent('none');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(consoleError).toHaveBeenCalled();
  });
});
