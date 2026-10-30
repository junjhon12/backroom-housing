import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Field, Input } from '../components/ui';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  // Return the user to the page that redirected them here, if any.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await loginUser({ email, password });
      login(data); // Update global context
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto mt-6 w-full max-w-md p-8">
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">Form 01 — Check-in</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-none">Returning resident</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        Present your credentials. The Registry does not keep paper copies.
      </p>

      {error && (
        <div role="alert" className="mt-6 border border-signal bg-signal/10 px-4 py-3 text-sm text-signal">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Field label="Email" htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password" htmlFor="login-password">
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Checking in…' : 'Check in'}
        </Button>
      </form>

      <p className="mt-6 border-t border-ink/20 pt-4 text-xs text-ink/70">
        No file on record?{' '}
        <Link to="/register" className="underline underline-offset-4 hover:text-signal">
          Apply for residency
        </Link>
      </p>
    </Card>
  );
};

export default Login;
