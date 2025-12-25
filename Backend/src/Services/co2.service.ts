export class CO2Service {
    /**
     * Calculate CO2 emissions for a parking trip
     */
    calculateCO2(data: {
        route_km: number;
        cruising_km?: number;
        vehicle_type: 'ICE' | 'EV';
        emission_factor_g_per_km?: number;
        grid_intensity_g_per_kwh?: number;
        efficiency_kwh_per_km?: number;
    }): { estimated_g: number } {
        const { route_km, cruising_km = 0, vehicle_type } = data;

        if (vehicle_type === 'ICE') {
            const emission_factor = data.emission_factor_g_per_km || 200; // Default: 200g/km
            const total_km = route_km + cruising_km;
            return { estimated_g: total_km * emission_factor };
        } else {
            // EV calculation
            const efficiency = data.efficiency_kwh_per_km || 0.2; // Default: 0.2 kWh/km
            const grid_intensity = data.grid_intensity_g_per_kwh || 400; // Default: 400g/kWh
            const energy_kwh = route_km * efficiency;
            return { estimated_g: energy_kwh * grid_intensity };
        }
    }

    /**
     * Compare CO2 impacts for multiple parking lots and calculate savings
     */
    compareLots(lots: Array<{ id: number; co2_estimated_g: number }>): {
        [key: number]: { estimated_g: number; savings_pct: number; is_lowest: boolean };
    } {
        if (lots.length === 0) return {};

        const co2Values = lots.map(lot => lot.co2_estimated_g);
        const maxCO2 = Math.max(...co2Values);
        const minCO2 = Math.min(...co2Values);

        const result: { [key: number]: { estimated_g: number; savings_pct: number; is_lowest: boolean } } = {};

        lots.forEach(lot => {
            const savings_pct = maxCO2 > 0 ? ((maxCO2 - lot.co2_estimated_g) / maxCO2) * 100 : 0;
            result[lot.id] = {
                estimated_g: lot.co2_estimated_g,
                savings_pct,
                is_lowest: lot.co2_estimated_g === minCO2
            };
        });

        return result;
    }
}
