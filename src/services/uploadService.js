import api from './api';

const uploadService = {
  // Upload multiple images
  uploadImages: async (files = []) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) {
      return { success: true, urls: [] };
    }

    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append('images', file);
    });

    // Allowing Axios to handle boundary parameters automatically
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });

    return response.data;
  },

  // Delete an image by public ID
  deleteImage: async (publicId) => {
    const response = await api.delete(`/upload/${encodeURIComponent(publicId)}`);
    return response.data;
  },
};

export default uploadService;