import api from './api';

const propertyService = {
  // Fetch public property listings with optional search/filter params
  getProperties: async (params = {}) => {
    const response = await api.get('/properties', { params });
    return response.data;
  },

  // Fetch a single property by its ID
  getPropertyById: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  // Fetch properties belonging to the currently authenticated host
  getMyProperties: async () => {
    const response = await api.get('/properties/my-listings');
    return response.data;
  },

  // Create a new property listing
  createProperty: async (payload) => {
    const response = await api.post('/properties', payload);
    return response.data;
  },

  // Update an existing property
  updateProperty: async (id, payload) => {
    const response = await api.put(`/properties/${id}`, payload);
    return response.data;
  },

  // Delete a property listing
  deleteProperty: async (id) => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },

  // Upload image files for property listings
  uploadPropertyImages: async (files = []) => {
    if (!files || files.length === 0) {
      return { success: true, data: [] };
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    // Letting Axios automatically set multipart boundaries
    const response = await api.post('/properties/upload', formData, {
      headers: {
        'Content-Type': undefined, 
      },
    });

    return response.data;
  },
};

export default propertyService;