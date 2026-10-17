import api from './api';

export const getStudentProfileApi = async () => {
  try {
    const response = await api.get('/students/profile');
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

export const createStudentProfileApi = async (profileData) => {
  try {
    const response = await api.post('/students/profile', profileData);
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

export const updateStudentProfileApi = async (profileData) => {
  try {
    const response = await api.put('/students/profile', profileData);
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
