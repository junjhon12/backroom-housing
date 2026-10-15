import type { Property, ApiResponse } from '../types/property';

export const fetchProperties = async (signal?: AbortSignal): Promise<Property[]> => {
  const response = await fetch('/api/properties', { signal });
  
  if (!response.ok) {
    throw new Error('Failed to fetch properties from the network');
  }

  const result: ApiResponse<Property[]> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid API response format');
  }

  return result.data as Property[];
};

export const fetchPropertyById = async (id: string, signal?: AbortSignal): Promise<Property> => {
  const response = await fetch(`/api/properties/${id}`, { signal });
  
  if (!response.ok) {
    if (response.status === 404) throw new Error('Property not found');
    throw new Error('Failed to fetch property details');
  }

  const result: ApiResponse<Property> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid API response format');
  }

  return result.data as Property;
};

export const fetchMyProperties = async (signal?: AbortSignal): Promise<Property[]> => {
  const token = getAuthToken();
  const response = await fetch('/api/properties/me', {
    signal,
    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
  });
  
  const result: ApiResponse<Property[]> = await response.json();
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch your properties');
  }
  return result.data as Property[];
};

export const deletePropertyListing = async (id: string): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`/api/properties/${id}`, {
    method: 'DELETE',
    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
  });
  
  const result: ApiResponse<null> = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to delete property');
  }
};