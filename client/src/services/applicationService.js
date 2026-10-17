import api from './api';

// Student Application APIs
export const applyForJobApi = async (applicationData) => {
  try {
    const response = await api.post('/applications', applicationData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getMyApplicationsApi = async (params = {}) => {
  try {
    const response = await api.get('/applications/my', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getMyApplicationByIdApi = async (applicationId) => {
  try {
    const response = await api.get(`/applications/${applicationId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const withdrawApplicationApi = async (applicationId) => {
  try {
    const response = await api.patch(`/applications/${applicationId}/withdraw`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

// Company Application APIs
export const getCompanyApplicationsApi = async (params = {}) => {
  try {
    const response = await api.get('/applications/company', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getCompanyApplicationByIdApi = async (applicationId) => {
  try {
    const response = await api.get(`/applications/company/${applicationId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const shortlistApplicationApi = async (applicationId) => {
  try {
    const response = await api.patch(`/applications/company/${applicationId}/shortlist`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const rejectApplicationApi = async (applicationId, data = {}) => {
  try {
    const response = await api.patch(`/applications/company/${applicationId}/reject`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const updateCompanyNotesApi = async (applicationId, data = {}) => {
  try {
    const response = await api.patch(`/applications/company/${applicationId}/notes`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};
