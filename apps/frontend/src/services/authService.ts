import type { User, AuthResponse } from '../types/auth';

const API_URL = '/api/auth';

export const registerUser = async (userData: Record<string, string>): Promise<User> => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  const result: AuthResponse = await response.json();
  
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || 'Registration failed');
  }
  
  return result.data;
};

export const loginUser = async (userData: Record<string, string>): Promise<User> => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  const result: AuthResponse = await response.json();
  
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || 'Login failed');
  }
  
  return result.data;
};