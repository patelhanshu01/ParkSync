import apiClient from './client';
import { Payment } from '../types/Payment';

const PAYMENT_BASE = '/payment';

export const getPayments = async () => {
  const response = await apiClient.get<Payment[]>(`${PAYMENT_BASE}/`);
  return response.data;
};

export const getPaymentById = async (id: number) => {
  const response = await apiClient.get<Payment>(`${PAYMENT_BASE}/${id}`);
  return response.data;
};

export const createPayment = async (data: any) => {
  const response = await apiClient.post<Payment>(`${PAYMENT_BASE}/`, data);
  return response.data;
};
