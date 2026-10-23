import api from './api';

const wishlistService = {
  // Get all saved wishlist items for the logged-in user
  getWishlist: async () => {
    const response = await api.get('/users/wishlist');
    return response.data;
  },

  // Add a property listing to the user's wishlist
  addWishlistItem: async (listingId) => {
    const response = await api.post('/users/wishlist', { listingId });
    return response.data;
  },

  // Remove a property listing from the user's wishlist
  removeWishlistItem: async (listingId) => {
    const response = await api.delete(`/users/wishlist/${listingId}`);
    return response.data;
  },
};

export default wishlistService;