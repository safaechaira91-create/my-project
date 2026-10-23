import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import authService from '../services/authService';
import { getErrorMessage } from '../utils/errorMessage';

const AuthContext = createContext();

const normalizeRole = (role) => {
  const safeRole = typeof role === 'string' ? role.toLowerCase() : '';
  if (!safeRole || safeRole === 'guest') return 'user';
  if (safeRole !== 'user' && safeRole !== 'host' && safeRole !== 'admin') return 'user';
  return safeRole;
};

const normalizeUser = (input) => {
  if (!input) return null;
  return {
    ...input,
    role: normalizeRole(input.role),
  };
};

const parseJSON = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return normalizeUser(parseJSON(savedUser));
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const persistAuth = useCallback((nextUser) => {
    if (!nextUser) return null;
    const normalized = normalizeUser(nextUser);
    localStorage.setItem('user', JSON.stringify(normalized));
    window.dispatchEvent(new Event('auth-changed'));
    return normalized;
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-changed'));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // تحديث بيانات المستخدم عند التعديل
  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const newUserData = { ...prev, ...updatedData };
      return persistAuth(newUserData);
    });
  }, [persistAuth]);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user');
      
      // تفادي إرسال طلب للمزود إلا ما كانش المستخدم مخزّن أصلاً
      if (!savedUser) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const me = await authService.getMe();
        if (isMounted) {
          const merged = persistAuth(me);
          setUser(merged || null);
        }
      } catch {
        if (isMounted) {
          clearAuth();
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [persistAuth, clearAuth]);

  useEffect(() => {
    const syncUser = () => {
      const savedUser = localStorage.getItem('user');
      setUser(normalizeUser(parseJSON(savedUser)));
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('auth-changed', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('auth-changed', syncUser);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.login(credentials);
      const data = persistAuth(res);
      setUser(data || null);
      return { success: true, user: data };
    } catch (err) {
      const message = getErrorMessage(err, 'Login failed');
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [persistAuth]);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.register(userData);
      const data = persistAuth(res);
      setUser(data || null);
      return { success: true, user: data };
    } catch (err) {
      const message = getErrorMessage(err, 'Registration failed');
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [persistAuth]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // الاستمرار في التنظيف المحلي حتى لو فشل طلب تسجيل الخروج
    } finally {
      clearAuth();
      setUser(null);
      setError(null);
    }
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      logout,
      updateUser,
      clearError,
      isAuthenticated: !!user,
    }),
    [user, loading, error, login, register, logout, updateUser, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};