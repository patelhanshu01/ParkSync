import apiClient from './client';

const ANALYTICS_BASE = '/analytics';

export const getAnalyticsSummary = async () => {
  const res = await apiClient.get(`${ANALYTICS_BASE}/summary`);
  return res.data;
};
