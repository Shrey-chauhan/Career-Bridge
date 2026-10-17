import api from './api';

// Company Job Management APIs
export const createJobApi = async (jobData) => {
  try {
    const response = await api.post('/jobs', jobData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getCompanyJobsApi = async () => {
  try {
    const response = await api.get('/jobs/company');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getCompanyJobByIdApi = async (jobId) => {
  try {
    const response = await api.get(`/jobs/company/${jobId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const updateJobApi = async (jobId, jobData) => {
  try {
    const response = await api.put(`/jobs/company/${jobId}`, jobData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const deleteJobApi = async (jobId) => {
  try {
    const response = await api.delete(`/jobs/company/${jobId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const publishJobApi = async (jobId) => {
  try {
    const response = await api.patch(`/jobs/company/${jobId}/publish`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const closeJobApi = async (jobId) => {
  try {
    const response = await api.patch(`/jobs/company/${jobId}/close`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

// Student Discovery & Eligibility APIs
export const getPublishedJobsApi = async (params = {}) => {
  try {
    const response = await api.get('/jobs', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getJobDetailsApi = async (jobId) => {
  try {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const checkEligibilityApi = async (jobId) => {
  try {
    const response = await api.get(`/jobs/${jobId}/eligibility`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};
