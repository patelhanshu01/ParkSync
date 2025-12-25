import axios from 'axios';

// Use same base URL as other APIs (adjust if needed based on your setup)
const API_URL = 'http://localhost:3000/api/reservation';

export interface Reservation {
  id: number;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  parkingLot: {
    id: number;
    name: string;
    location: string;
    rate_hourly_cad: number;
    pricePerHour?: number; // Add optional if backend returns this too
  };
  payments: {
    id: number;
    amount: number;
    status: string;
  }[];
  spot?: {
    id: number;
    spot_number: string;
    floor_level: number;
    status?: 'available' | 'occupied' | 'reserved' | 'ev_charging' | 'accessibility';
  };
  status?: 'active' | 'completed' | 'cancelled' | 'upcoming'; // derived often on frontend or backend
}

// Create a configured axios instance
const reservationAxios = axios.create({
  baseURL: API_URL
});

// Add interceptor to add token to requests
reservationAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getMyBookings = async (): Promise<Reservation[]> => {
  const response = await reservationAxios.get<Reservation[]>('/my-bookings');
  return response.data;
};

export const createReservation = async (data: any): Promise<Reservation> => {
  const response = await reservationAxios.post<Reservation>('/', data);
  return response.data;
};
