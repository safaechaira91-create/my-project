import api from './api';

const normalizeAuthPayload = (payload = {}) => {
  const nestedUser = payload.user || {};
  const userObj = {
    ...nestedUser,
    ...payload,
  };

  // Extract tokens before stripping from user profile state
  const accessToken = payload.accessToken || payload.token || nestedUser.accessToken || nestedUser.token;

  delete userObj.user;
  delete userObj.accessToken;
  delete userObj.token;

  return { user: userObj, accessToken };
};

const persistAuth = (payload) => {
  const { user, accessToken } = normalizeAuthPayload(payload);

  try {
    if (user && Object.keys(user).length > 0) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    if (accessToken) {
      localStorage.setItem('token', accessToken);
    }
  } catch (error) {
    console.error('Error persisting auth data to localStorage:', error);
  }

  return user;
};

const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return persistAuth(response.data);
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return persistAuth(response.data);
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error on server:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-changed'));
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  resendVerificationEmail: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },
};

export default authService;