import type { Property, ApiResponse } from '../types/property';
import { readAuthToken } from '../lib/authStorage';

export const fetchFavorites = async (signal?: AbortSignal): Promise<Property[]> => {
  const token = readAuthToken();
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
  const token = readAuthToken();
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