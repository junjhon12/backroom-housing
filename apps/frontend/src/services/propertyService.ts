import type { Property, ApiResponse, PaginatedResponse, PaginationMeta, PropertyInput } from '../types/property';
import { readAuthToken } from '../lib/authStorage';

export interface PropertyPage {
  properties: Property[];
  meta: PaginationMeta;
}

/**
 * `fetch` rejects on a connection failure and resolves with a non-2xx status
 * otherwise. Both are turned into a message the user can act on instead of the
 * browser's "Failed to fetch".
 */
const request = async (url: string, init?: RequestInit): Promise<Response> => {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('The registry is unreachable. Check that the API and database are running.');
  }
};

const readApiError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `${fallback} (${response.status})`;
  } catch {
    return `${fallback} (${response.status})`;
  }
};

export const fetchProperties = async (
  queryString: string = '',
  signal?: AbortSignal
): Promise<PropertyPage> => {
  const url = queryString ? `/api/properties?${queryString}` : '/api/properties';
  const response = await request(url, { signal });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'The registry could not return listings'));
  }

  const result: PaginatedResponse<Property> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid API response format');
  }

  return { properties: result.data, meta: result.meta };
};

export const fetchPropertyById = async (id: string, signal?: AbortSignal): Promise<Property> => {
  const response = await request(`/api/properties/${id}`, { signal });

  if (!response.ok) {
    if (response.status === 404) throw new Error('Property not found');
    throw new Error(await readApiError(response, 'The registry could not return this file'));
  }

  const result: ApiResponse<Property> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid API response format');
  }

  return result.data as Property;
};

export const createPropertyListing = async (data: PropertyInput): Promise<Property> => {
  const token = readAuthToken();
  
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
  const token = readAuthToken();
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
  const token = readAuthToken();
  const response = await fetch(`/api/properties/${id}`, {
    method: 'DELETE',
    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
  });
  
  const result: ApiResponse<null> = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to delete property');
  }
};

export const updatePropertyListing = async (id: string, data: PropertyInput): Promise<Property> => {
  const token = readAuthToken();
  
  const response = await fetch(`/api/properties/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<Property> = await response.json();
  
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || 'Failed to update property listing');
  }

  return result.data as Property;
};

export const uploadImage = async (file: File): Promise<string> => {
  const token = readAuthToken();
  const formData = new FormData();
  formData.append('image', file); // 'image' matches the upload.single('image') backend config

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      // CRITICAL: Do not set Content-Type here. The browser must set it with the boundary automatically.
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData,
  });
  
  const result: ApiResponse<string> = await response.json();
  
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || 'Failed to upload image');
  }

  return result.data;
};