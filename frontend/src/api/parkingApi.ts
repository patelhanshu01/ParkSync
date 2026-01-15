import apiClient from './client';
import { ParkingLot } from '../types/Parking';

const PARKING_BASE = '/parking';

export interface SearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  search?: string;
  includeReservations?: boolean;
  sort_by?: 'price_asc' | 'price_desc' | 'distance_asc' | 'distance_desc';
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  results: ParkingLot[];
  searchMetadata?: {
    lat: number;
    lng: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getParkingLots = (params?: SearchParams) =>
  apiClient.get<SearchResponse>(PARKING_BASE, { params });

export const getParkingLotById = (id: number, params?: { includeReservations?: boolean }) =>
  apiClient.get<ParkingLot>(`${PARKING_BASE}/${id}`, { params });

export const createParkingLot = (body: ParkingLot) =>
  apiClient.post<ParkingLot>(PARKING_BASE, body);

export const updateParkingLot = (id: number, body: ParkingLot) =>
  apiClient.put<ParkingLot>(`${PARKING_BASE}/${id}`, body);

export const deleteParkingLot = (id: number) =>
  apiClient.delete(`${PARKING_BASE}/${id}`);
