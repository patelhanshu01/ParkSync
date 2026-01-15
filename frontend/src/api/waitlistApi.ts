import apiClient from './client';

const WAITLIST_BASE = '/waitlist';

export const joinWaitlist = async (data: { parkingLotId: number; contact_email?: string; phone?: string }) => {
  const res = await apiClient.post(`${WAITLIST_BASE}/`, data);
  return res.data;
};

export const getWaitlistForLot = async (lotId: number) => {
  const res = await apiClient.get(`${WAITLIST_BASE}/${lotId}`);
  return res.data;
};
