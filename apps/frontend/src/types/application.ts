import type { Property } from './property';

export type ApplicationStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export interface Application {
  _id: string;
  property: Property | null;
  applicant?: {
    _id: string;
    name: string;
    email: string;
  };
  host: string;
  message: string;
  moveInDate?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}
