import axios from 'axios';
import { ParkingLot } from '../types/Parking';

const API = 'http://localhost:3000/api/parking';

export interface SearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  search?: string;
  includeReservations?: boolean;
}

export interface SearchResponse {
  results: ParkingLot[];
  searchMetadata?: {
    lat: number;
    lng: number;
  };
}

export const getParkingLots = (params?: SearchParams) =>
  axios.get<SearchResponse>(API, { params });

export const getParkingLotById = (id: number, params?: { includeReservations?: boolean }) =>
  axios.get<ParkingLot>(`${API}/${id}`, { params });

export const createParkingLot = (body: ParkingLot) =>
  axios.post<ParkingLot>(API, body);

export const updateParkingLot = (id: number, body: ParkingLot) =>
  axios.put<ParkingLot>(`${API}/${id}`, body);

export const deleteParkingLot = (id: number) =>
  axios.delete(`${API}/${id}`);
