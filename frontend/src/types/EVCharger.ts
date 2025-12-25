export interface EVCharger {
    connector_type: 'CCS2' | 'Type2' | 'NACS' | 'CHAdeMO' | 'J1772';
    power_kw: number;
    cost_per_kwh?: number;
    availability: boolean;
    charger_id?: string;
}

export interface EVFilter {
    connector_types: string[];
    min_power_kw?: number;
}
