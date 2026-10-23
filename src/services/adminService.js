import api from './api';

// Helper function to unwrap response payload consistently
const unwrap = (promise) => promise.then((res) => res.data);

const adminService = {
  // Stats
  getStats: () => unwrap(api.get('/admin/stats')),

  // Users
  getUsers: (params) => unwrap(api.get('/admin/users', { params })),
  updateUser: (id, payload) => unwrap(api.patch(`/admin/users/${id}`, payload)),
  deleteUser: (id) => unwrap(api.delete(`/admin/users/${id}`)),

  // Listings
  getListings: (params) => unwrap(api.get('/admin/listings', { params })),
  updateListing: (id, payload) => unwrap(api.patch(`/admin/listings/${id}`, payload)),
  deleteListing: (id) => unwrap(api.delete(`/admin/listings/${id}`)),

  // Bookings
  getBookings: (params) => unwrap(api.get('/admin/bookings', { params })),
  updateBooking: (id, payload) => unwrap(api.patch(`/admin/bookings/${id}`, payload)),

  // Messages & Host Requests
  getMessages: (params) => unwrap(api.get('/admin/messages', { params })),
  updateMessage: (id, payload) => unwrap(api.patch(`/admin/messages/${id}`, payload)),
  deleteMessage: (id) => unwrap(api.delete(`/admin/messages/${id}`)),
  updateHostRequest: (id, payload) => unwrap(api.patch(`/admin/host-requests/${id}`, payload)),

  // Notifications
  sendNotification: (payload) => unwrap(api.post('/admin/notifications', payload)),
};

export default adminService;