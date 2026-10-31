import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

const authState = vi.hoisted(() => ({
  user: null as { name: string; role: 'renter' | 'host' | 'admin' } | null,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

const renderAt = (path: string, allowedRoles?: string[]) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/favorites" element={<div>saved files</div>} />
          <Route path="/dashboard" element={<div>host console</div>} />
        </Route>
        <Route path="/login" element={<div>sign in page</div>} />
        <Route path="/" element={<div>directory</div>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  authState.user = null;
});

describe('ProtectedRoute', () => {
  it('redirects anonymous visitors to the sign-in page', () => {
    renderAt('/favorites');
    expect(screen.getByText('sign in page')).toBeInTheDocument();
  });

  it('renders the requested route for an authenticated renter', () => {
    authState.user = { name: 'Ada', role: 'renter' };
    renderAt('/favorites');
    expect(screen.getByText('saved files')).toBeInTheDocument();
  });

  it('redirects a renter away from host-only routes', () => {
    authState.user = { name: 'Ada', role: 'renter' };
    renderAt('/dashboard', ['host', 'admin']);
    expect(screen.getByText('directory')).toBeInTheDocument();
  });

  it('allows a host into the console', () => {
    authState.user = { name: 'Host', role: 'host' };
    renderAt('/dashboard', ['host', 'admin']);
    expect(screen.getByText('host console')).toBeInTheDocument();
  });
});
