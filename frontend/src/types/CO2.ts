export interface CO2Impact {
    estimated_g: number;
    savings_pct: number;
    is_lowest: boolean;
}

export interface CO2Calculation {
    route_km: number;
    cruising_km: number;
    vehicle_type: 'ICE' | 'EV';
    emission_factor_g_per_km?: number;
    grid_intensity_g_per_kwh?: number;
    efficiency_kwh_per_km?: number;
}
