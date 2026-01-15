import apiClient from './client';
import { CO2Calculation, CO2Impact } from '../types/CO2';

const CO2_BASE = '/co2';

export const calculateCO2Score = (data: CO2Calculation) =>
    apiClient.post<CO2Impact>(`${CO2_BASE}/score`, data);

export const getCO2Comparison = (lotIds: number[]) =>
    apiClient.post<{ [key: number]: CO2Impact }>(`${CO2_BASE}/compare`, { lot_ids: lotIds });
