import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Field, Input } from '../components/ui';

const Register: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await registerUser({ name, email, password, role: 'renter' });
      login(data);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto mt-6 w-full max-w-md p-8">
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">Form 02 — Application</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-none">Apply for residency</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        All applicants are recorded. Filing does not guarantee placement.
      </p>

      {error && (
        <div role="alert" className="mt-6 border border-signal bg-signal/10 px-4 py-3 text-sm text-signal">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Field label="Full name" htmlFor="register-name">
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
          />
        </Field>

        <Field label="Email" htmlFor="register-email">
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password" htmlFor="register-password" hint="Minimum 6 characters.">
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Filing…' : 'File application'}
        </Button>
      </form>

      <p className="mt-6 border-t border-ink/20 pt-4 text-xs text-ink/70">
        Already on file?{' '}
        <Link to="/login" className="underline underline-offset-4 hover:text-signal">
          Check in
        </Link>
      </p>
    </Card>
  );
};

export default Register;
