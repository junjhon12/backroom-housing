export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'renter' | 'host' | 'admin';
  token: string;
}

export interface AuthResponse {
  success: boolean;
  data?: User;
  error?: string;
}