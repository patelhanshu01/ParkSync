import axios from 'axios';
import { CO2Calculation, CO2Impact } from '../types/CO2';

const API = 'http://localhost:3000/api/co2';

export const calculateCO2Score = (data: CO2Calculation) =>
    axios.post<CO2Impact>(`${API}/score`, data);

export const getCO2Comparison = (lotIds: number[]) =>
    axios.post<{ [key: number]: CO2Impact }>(`${API}/compare`, { lot_ids: lotIds });
