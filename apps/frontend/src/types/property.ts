export interface Property {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: string;
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
export type PropertyInput = Omit<Property, '_id' | 'createdAt' | 'updatedAt'>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}