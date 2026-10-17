import api from './api';

export const createInterviewApi = async (interviewData) => {
  try {
    const response = await api.post('/interviews', interviewData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getInterviewsApi = async (params = {}) => {
  try {
    const response = await api.get('/interviews', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getInterviewByIdApi = async (interviewId) => {
  try {
    const response = await api.get(`/interviews/${interviewId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const rescheduleInterviewApi = async (interviewId, data) => {
  try {
    const response = await api.patch(`/interviews/${interviewId}/reschedule`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const cancelInterviewApi = async (interviewId, cancellationReason = '') => {
  try {
    const response = await api.patch(`/interviews/${interviewId}/cancel`, { cancellationReason });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const confirmInterviewApi = async (interviewId) => {
  try {
    const response = await api.patch(`/interviews/${interviewId}/confirm`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const completeInterviewApi = async (interviewId) => {
  try {
    const response = await api.patch(`/interviews/${interviewId}/complete`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const updateInterviewResultApi = async (interviewId, resultData) => {
  try {
    const response = await api.patch(`/interviews/${interviewId}/result`, resultData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const markNoShowApi = async (interviewId) => {
  try {
    const response = await api.patch(`/interviews/${interviewId}/no-show`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};
