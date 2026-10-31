import type { Application, ApplicationStatus } from '../types/application';
import type { ApiResponse } from '../types/property';
import { readAuthToken } from '../lib/authStorage';

const authHeaders = (json = false): HeadersInit => {
  const token = readAuthToken();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const readApiError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `${fallback} (${response.status})`;
  } catch {
    return `${fallback} (${response.status})`;
  }
};

const request = async (url: string, init?: RequestInit): Promise<Response> => {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('The registry is unreachable. Check that the API and database are running.');
  }
};

const readList = async (response: Response, fallback: string): Promise<Application[]> => {
  if (!response.ok) {
    throw new Error(await readApiError(response, fallback));
  }

  const result: ApiResponse<Application[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid API response format');
  }

  return result.data;
};

const readOne = async (response: Response, fallback: string): Promise<Application> => {
  if (!response.ok) {
    throw new Error(await readApiError(response, fallback));
  }

  const result: ApiResponse<Application> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid API response format');
  }

  return result.data;
};

export interface ApplicationInput {
  propertyId: string;
  message: string;
  moveInDate?: string;
}

export const submitApplication = async (input: ApplicationInput): Promise<Application> => {
  const response = await request('/api/applications', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(input),
  });

  return readOne(response, 'The application could not be filed');
};

export const fetchMyApplications = async (signal?: AbortSignal): Promise<Application[]> => {
  const response = await request('/api/applications/mine', {
    signal,
    headers: authHeaders(),
  });

  return readList(response, 'Your applications could not be loaded');
};

export const fetchReceivedApplications = async (signal?: AbortSignal): Promise<Application[]> => {
  const response = await request('/api/applications/received', {
    signal,
    headers: authHeaders(),
  });

  return readList(response, 'The host inbox could not be loaded');
};

export const respondToApplication = async (
  id: string,
  status: Extract<ApplicationStatus, 'accepted' | 'declined'>
): Promise<Application> => {
  const response = await request(`/api/applications/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ status }),
  });

  return readOne(response, 'The application could not be updated');
};

export const withdrawApplication = async (id: string): Promise<Application> => {
  const response = await request(`/api/applications/${id}/withdraw`, {
    method: 'PATCH',
    headers: authHeaders(),
  });

  return readOne(response, 'The application could not be withdrawn');
};
