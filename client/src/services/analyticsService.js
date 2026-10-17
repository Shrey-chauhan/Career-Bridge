import api from './api';

export const getOverviewAnalyticsApi = async (params = {}) => {
  const response = await api.get('/admin/analytics/overview', { params });
  return response.data;
};

export const getRecruitmentFunnelApi = async (params = {}) => {
  const response = await api.get('/admin/analytics/funnel', { params });
  return response.data;
};

export const getApplicationTrendsApi = async (params = {}) => {
  const response = await api.get('/admin/analytics/trends', { params });
  return response.data;
};

export const getCompanyPerformanceApi = async (params = {}) => {
  const response = await api.get('/admin/analytics/companies', { params });
  return response.data;
};

export const getJobPerformanceApi = async (params = {}) => {
  const response = await api.get('/admin/analytics/jobs', { params });
  return response.data;
};

export const getBranchPerformanceApi = async (params = {}) => {
  const response = await api.get('/admin/analytics/branches', { params });
  return response.data;
};

export const getInterviewAnalyticsApi = async (params = {}) => {
  const response = await api.get('/admin/analytics/interviews', { params });
  return response.data;
};

export const getDriveAnalyticsApi = async (params = {}) => {
  const response = await api.get('/admin/analytics/drives', { params });
  return response.data;
};

export const getInsightsApi = async (params = {}) => {
  const response = await api.get('/admin/analytics/insights', { params });
  return response.data;
};

export const downloadAnalyticsCsvApi = async (type, params = {}) => {
  const response = await api.get(`/admin/analytics/export/${type}`, {
    params,
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `careerbridge_${type}_analytics.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
