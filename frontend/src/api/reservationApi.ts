import apiClient from './client';

// Helper to keep paths relative to the base URL
const RESERVATION_BASE = '/reservation';

export interface Reservation {
  id: number;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  reservedEndTime?: string;
  autoExtendEnabled?: boolean;
  autoExtendIntervalMinutes?: number;
  autoExtendCapMinutes?: number;
  reminderSentAt?: string | null;
  endedAt?: string | null;
  co2_estimated_g?: number;
  contactName?: string;
  contactEmail?: string;
  parkingLot?: {
    id: number;
    name: string;
    location: string;
    rate_hourly_cad: number;
    pricePerHour?: number; // Add optional if backend returns this too
    distance_km?: number;
  };
  listing?: {
    id: number;
    title?: string;
    address?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    distance_km?: number;
    pricePerHour?: number | string;
  };
  payments: {
    id: number;
    amount: number;
    status: string;
    method?: string;
  }[];
  spot?: {
    id: number;
    spot_number: string;
    floor_level: number;
    status?: 'available' | 'occupied' | 'reserved' | 'ev_charging' | 'accessibility';
  };
  status?: 'active' | 'completed' | 'cancelled' | 'upcoming'; // derived often on frontend or backend
}

export const getMyBookings = async (): Promise<Reservation[]> => {
  const response = await apiClient.get<Reservation[]>(`${RESERVATION_BASE}/my-bookings`);
  return response.data;
};

export const createReservation = async (data: any): Promise<Reservation> => {
  const response = await apiClient.post<Reservation>(`${RESERVATION_BASE}/`, data);
  return response.data;
};

export const setAutoExtend = async (reservationId: number, payload: { enabled: boolean; intervalMinutes?: number; capMinutes?: number }) => {
  const response = await apiClient.post<Reservation>(`${RESERVATION_BASE}/${reservationId}/auto-extend`, payload);
  return response.data;
};

export const extendReservation = async (reservationId: number, minutes: number) => {
  const response = await apiClient.post<Reservation>(`${RESERVATION_BASE}/${reservationId}/extend`, { minutes });
  return response.data;
};

export const endReservation = async (reservationId: number) => {
  const response = await apiClient.post<Reservation>(`${RESERVATION_BASE}/${reservationId}/end`);
  return response.data;
};
