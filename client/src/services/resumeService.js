import api from './api';

export const uploadResumeApi = async (formData, onUploadProgress = null) => {
  try {
    const response = await api.post('/resumes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getMyResumeApi = async () => {
  try {
    const response = await api.get('/resumes/me');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getResumeByIdApi = async (resumeId) => {
  try {
    const response = await api.get(`/resumes/${resumeId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const deleteResumeApi = async (resumeId) => {
  try {
    const response = await api.delete(`/resumes/${resumeId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};
