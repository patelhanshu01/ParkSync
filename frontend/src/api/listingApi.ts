import apiClient from './client';
import { Listing } from '../types/Listing';

const LISTINGS_BASE = '/listings';

export const getListings = (params?: any) =>
  apiClient.get<{ results: Listing[] }>(LISTINGS_BASE, { params });
export const getListingById = (id: number) =>
  apiClient.get<Listing>(`${LISTINGS_BASE}/${id}`);
export const createListing = (body: Partial<Listing>) =>
  apiClient.post<Listing>(LISTINGS_BASE, body);
export const updateListing = (id: number, body: Partial<Listing>) =>
  apiClient.put<Listing>(`${LISTINGS_BASE}/${id}`, body);
export const deleteListing = (id: number) =>
  apiClient.delete(`${LISTINGS_BASE}/${id}`);

// Reserve a private listing (driveway) for a time window
export const reserveListing = (listingId: number, body: any) => {
  return apiClient.post(`${LISTINGS_BASE}/${listingId}/reserve`, body);
};
