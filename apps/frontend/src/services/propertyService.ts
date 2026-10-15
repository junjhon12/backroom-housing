import type { Property, ApiResponse, PropertyInput } from '../types/property';

// Helper to extract JWT from local storage
const getAuthToken = (): string | null => {
  const storedUser = localStorage.getItem('backroom_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.token;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const fetchProperties = async (signal?: AbortSignal): Promise<Property[]> => {
  const response = await fetch('/api/properties', { signal });
  
  if (!response.ok) {
    throw new Error('Failed to fetch properties from the network');
  }

  const result: ApiResponse<Property[]> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid API response format');
  }

  return result.data;
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

export const createPropertyListing = async (data: PropertyInput): Promise<Property> => {
  const token = getAuthToken();
  
  const response = await fetch('/api/properties', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<Property> = await response.json();
  
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || 'Failed to create property listing');
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