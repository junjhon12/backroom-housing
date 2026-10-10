import { type Property, type ApiResponse } from '../types/property';

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