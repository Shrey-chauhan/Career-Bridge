import api from './api';

export const getAdminMetricsApi = async () => {
  try {
    const response = await api.get('/admin/dashboard');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getAdminStudentsApi = async (params = {}) => {
  try {
    const response = await api.get('/admin/students', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getAdminStudentByIdApi = async (studentId) => {
  try {
    const response = await api.get(`/admin/students/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const toggleStudentStatusApi = async (studentId, isActive) => {
  try {
    const response = await api.patch(`/admin/students/${studentId}/status`, { isActive });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getAdminCompaniesApi = async (params = {}) => {
  try {
    const response = await api.get('/admin/companies', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const verifyCompanyApi = async (companyId, status) => {
  try {
    const response = await api.patch(`/admin/companies/${companyId}/verify`, { status });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getAdminJobsApi = async (params = {}) => {
  try {
    const response = await api.get('/admin/jobs', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getAdminApplicationsApi = async (params = {}) => {
  try {
    const response = await api.get('/admin/applications', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getAdminInterviewsApi = async (params = {}) => {
  try {
    const response = await api.get('/admin/interviews', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getAdminAuditLogsApi = async (params = {}) => {
  try {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const createPlacementDriveApi = async (driveData) => {
  try {
    const response = await api.post('/admin/drives', driveData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getPlacementDrivesApi = async (params = {}) => {
  try {
    const response = await api.get('/admin/drives', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getPlacementDriveByIdApi = async (driveId) => {
  try {
    const response = await api.get(`/admin/drives/${driveId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const updatePlacementDriveApi = async (driveId, driveData) => {
  try {
    const response = await api.put(`/admin/drives/${driveId}`, driveData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const associateJobsToDriveApi = async (driveId, jobIds) => {
  try {
    const response = await api.patch(`/admin/drives/${driveId}/jobs`, { jobIds });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};
