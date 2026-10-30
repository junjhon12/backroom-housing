export type HazardClass = 'safe' | 'caution' | 'hostile';

export interface Property {
  _id: string;
  title: string;
  description: string;
  price: number;
  level: string;
  sector: string;
  hazardClass: HazardClass;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  isAvailable: boolean;
  host: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Explicit type for creation payloads, omitting auto-generated DB fields
export type PropertyInput = Omit<Property, '_id' | 'createdAt' | 'updatedAt' | 'host'>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}
