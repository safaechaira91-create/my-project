import { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import api from '../services/api';
import i18n from '../locales/i18n';

const AppContext = createContext();

const parseJSON = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const AppProvider = ({ children }) => {
  // 1. Language State
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'ar');

  // 2. Currency State
  const [currency, setCurrency] = useState(() => {
    const savedCurrency = localStorage.getItem('currency');
    return parseJSON(savedCurrency, { code: 'MAD', symbol: 'DH', name: 'درهم مغربي' });
  });

  // 3. Global App States
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Notification Helper
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
  }, []);

  // Sync Language with i18next & LocalStorage
  useEffect(() => {
    localStorage.setItem('language', language);
    if (i18n && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(language);
    }
  }, [language]);

  // Sync Currency with LocalStorage
  useEffect(() => {
    localStorage.setItem('currency', JSON.stringify(currency));
  }, [currency]);

  // Fetch Properties Function
  const fetchProperties = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/properties', { params });
      const incoming = response.data?.listings ?? response.data ?? [];
      setProperties(Array.isArray(incoming) ? incoming : []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Fetch the exact unread notifications count from a dedicated lightweight
  // endpoint (backed by countDocuments, so it's accurate regardless of pagination).
  const refreshUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(Number(response.data?.count) || 0);
    } catch {
      // Silent failure: the unread badge simply won't update this cycle.
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    const onAuthChanged = () => refreshUnreadCount();
    window.addEventListener('auth-changed', onAuthChanged);
    return () => window.removeEventListener('auth-changed', onAuthChanged);
  }, [refreshUnreadCount]);

  const isRtl = useMemo(() => language === 'ar', [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      currency,
      setCurrency,
      isRtl,
      properties,
      setProperties,
      loading,
      setLoading,
      notification,
      setNotification,
      showNotification,
      unreadCount,
      setUnreadCount,
      refreshUnreadCount,
      fetchProperties,
    }),
    [
      language,
      currency,
      isRtl,
      properties,
      loading,
      notification,
      showNotification,
      unreadCount,
      refreshUnreadCount,
      fetchProperties,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};