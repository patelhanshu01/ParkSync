import apiClient from './client';
import { AuthResponse } from './authApi';

export interface HostApplicationPayload {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  routingNumber: string;
  payoutEmail?: string;
}

export const submitHostApplication = async (
  payload: HostApplicationPayload
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    '/user/host-application',
    payload
  );
  return response.data;
};
