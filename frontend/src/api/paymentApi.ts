import axios from 'axios';
import { Payment } from '../types/Payment';

const API_URL = 'http://localhost:3000/api/payment';

const paymentAxios = axios.create({
  baseURL: API_URL,
});

paymentAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getPayments = async () => {
  const response = await paymentAxios.get<Payment[]>('/');
  return response.data;
};

export const getPaymentById = async (id: number) => {
  const response = await paymentAxios.get<Payment>(`/${id}`);
  return response.data;
};

export const createPayment = async (data: any) => {
  const response = await paymentAxios.post<Payment>('/', data);
  return response.data;
};

