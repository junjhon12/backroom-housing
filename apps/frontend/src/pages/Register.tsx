import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

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
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Create an Account</h2>
      
      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input 
            id="register-name"
            type="text" 
            autoComplete="name"
            required 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input 
            id="register-email"
            type="email" 
            autoComplete="email"
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input 
            id="register-password"
            type="password" 
            autoComplete="new-password"
            required 
            minLength={6}
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="At least 6 characters"
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full py-2.5 rounded-lg text-white font-semibold transition-all ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account? <Link to="/login" className="text-indigo-600 hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  );
};

export default Register;
