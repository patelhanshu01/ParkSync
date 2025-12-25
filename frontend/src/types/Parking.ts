import { CO2Impact } from './CO2';
import { EVCharger } from './EVCharger';

export interface ParkingLot {
  id?: number;
  name: string;
  location: string;
  pricePerHour: number;
  isAvailable: boolean;
  totalSpots?: number;
  availableSpots?: number;

  // CO2 Impact
  co2_impact?: CO2Impact;

  // EV Charging
  ev_chargers?: EVCharger[];
  has_ev_charging?: boolean;

  // Amenities
  is_covered?: boolean;
  has_cctv?: boolean;
  is_free?: boolean;
  has_accessibility?: boolean;
  height_limit_m?: number;

  // Location details
  distance_km?: number;
  latitude?: number;
  longitude?: number;

  // Spot visualization
  spots?: ParkingSpot[];

  // Ratings
  rating?: number;
  best_value_score?: number;
}

export interface ParkingSpot {
  id?: number;
  spot_number: string;
  status: 'available' | 'occupied' | 'reserved' | 'ev_charging' | 'accessibility';
  type?: string;
  floor_level?: number;
  position_x?: number;
  position_y?: number;
  grid_x?: number;
  grid_y?: number;
  nextReservation?: {
    id: number;
    startTime: string;
    endTime: string;
    user?: { id?: number; name?: string } | null;
  } | null;
}

export interface SearchFilters {
  price_range?: {
    min: number;
    max: number;
  };
  ev_filter?: {
    enabled: boolean;
    connector_types?: string[];
  };
  amenities?: {
    covered?: boolean;
    cctv?: boolean;
    free?: boolean;
    accessibility?: boolean;
  };
  sort_by?: 'price_asc' | 'price_desc' | 'distance_asc' | 'distance_desc' | 'co2_asc' | 'co2_desc';
  only_available?: boolean;
}