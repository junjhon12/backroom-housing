import type { Property, ApiResponse } from '../types/property';

// Helper to extract JWT from local storage (mirrors the implementation in propertyService)
const getAuthToken = (): string | null => {
  const storedUser = localStorage.getItem('backroom_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.token;
    } catch {
      return null;
    }
  }
  return null;
};

export const fetchFavorites = async (signal?: AbortSignal): Promise<Property[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('User not authenticated');

  const response = await fetch('/api/users/favorites', {
    signal,
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result: ApiResponse<Property[]> = await response.json();
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch favorites');
  }

  return result.data;
};

export const toggleFavoriteListing = async (propertyId: string): Promise<string[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('User not authenticated');

  const response = await fetch(`/api/users/favorites/${propertyId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result: ApiResponse<string[]> = await response.json();
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || 'Failed to toggle favorite status');
  }

  return result.data; // Returns the updated array of favorite ObjectIds
};