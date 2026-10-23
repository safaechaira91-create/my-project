import api from './api';

const reviewService = {
  // Get paginated reviews for a listing (public)
  getReviewsByListing: async (listingId, params = {}) => {
    const response = await api.get(`/reviews/listing/${listingId}`, { params });
    return response.data;
  },

  // Create a review (requires a confirmed/completed booking for this listing)
  createReview: async ({ listingId, rating, comment }) => {
    const response = await api.post('/reviews', { listingId, rating, comment });
    return response.data;
  },

  // Host reply to a review
  replyToReview: async (reviewId, hostReply) => {
    const response = await api.put(`/reviews/${reviewId}/reply`, { hostReply });
    return response.data;
  },

  // Delete a review (owner or admin)
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

export default reviewService;