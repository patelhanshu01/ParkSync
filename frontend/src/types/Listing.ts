export interface Listing {
  id: number;
  title: string;
  description?: string;
  owner?: { id: number; name?: string; email?: string };
  pricePerHour?: number | string; // API may return number or string
  isPrivate?: boolean;
  isActive?: boolean;
  location?: string;
  latitude?: number;
  longitude?: number;
  contact_info?: string;
  imageUrl?: string;
  address?: string;
  createdAt?: string;
}
