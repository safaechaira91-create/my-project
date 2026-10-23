import api from './api';

const bookingService = {
  // Create a new property booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Retrieve current user's bookings
  getMyBookings: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  // Cancel an existing booking
  cancelBooking: async (id) => {
    const response = await api.patch(`/bookings/${id}/cancel`);
    return response.data;
  },

  // Fetch reserved/busy dates for a specific property listing
  getBusyDates: async (listingId) => {
    const response = await api.get(`/bookings/listing/${listingId}`);
    return response.data;
  },
};

export default bookingService;