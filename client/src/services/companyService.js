import api from './api';

export const getCompanyProfileApi = async () => {
  try {
    const response = await api.get('/companies/profile');
    return response.data;
  } catch (error) {
    if (error.response) {
      const errData = typeof error.response.data === 'object' && error.response.data !== null
        ? error.response.data
        : { message: String(error.response.data) };
      errData.status = error.response.status;
      throw errData;
    }
    throw { message: error.message };
  }
};

export const createCompanyProfileApi = async (companyData) => {
  try {
    const response = await api.post('/companies/profile', companyData);
    return response.data;
  } catch (error) {
    if (error.response) {
      const errData = typeof error.response.data === 'object' && error.response.data !== null
        ? error.response.data
        : { message: String(error.response.data) };
      errData.status = error.response.status;
      throw errData;
    }
    throw { message: error.message };
  }
};

export const updateCompanyProfileApi = async (companyData) => {
  try {
    const response = await api.put('/companies/profile', companyData);
    return response.data;
  } catch (error) {
    if (error.response) {
      const errData = typeof error.response.data === 'object' && error.response.data !== null
        ? error.response.data
        : { message: String(error.response.data) };
      errData.status = error.response.status;
      throw errData;
    }
    throw { message: error.message };
  }
};
