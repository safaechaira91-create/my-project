import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Camera, Loader2, Mail, Trash2, User, Globe, Coins, Heart, Lock, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import wishlistService from '../../services/wishlistService';
import { format } from 'date-fns';
import { arMA } from 'date-fns/locale';
import { getImageUrl } from '../../utils/images';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/errorMessage';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: authUser, logout, loading: authLoading, updateUser } = useAuth();
  const { showNotification, setLanguage, currency, setCurrency } = useAppContext();
  const { t, isRtl, language: appLanguage } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', bio: '', image: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saveError, setSaveError] = useState('');

  const currencyOptions = [
    { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
  ];

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (authUser) {
      setFormData({
        name: authUser.name || '',
        email: authUser.email || '',
        bio: authUser.bio || '',
        image: authUser.image || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      });
    }
  }, [authUser]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (authLoading || !authUser?._id) return;
      try {
        const { data } = await api.get('/bookings?role=guest');
        setBookings(data || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, [authUser?._id, authLoading]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (authLoading || !authUser?._id) {
        setWishlist([]);
        return;
      }

      try {
        const items = await wishlistService.getWishlist();
        setWishlist(items || []);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setWishlist([]);
      }
    };

    fetchWishlist();
  }, [authUser?._id, authLoading]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
      if (!isEditing) setIsEditing(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Email/password changes require the current password to be confirmed (backend requirement).
  const emailChanged = authUser && formData.email.trim().toLowerCase() !== (authUser.email || '').toLowerCase();
  const wantsPasswordChange = passwordData.newPassword.trim().length > 0;
  const requiresCurrentPassword = emailChanged || wantsPasswordChange;

  const resetPasswordFields = () => {
    setPasswordData({ currentPassword: '', newPassword: '' });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Cancel edit: reset form to current user data
      setFormData({
        name: authUser?.name || '',
        email: authUser?.email || '',
        bio: authUser?.bio || '',
        image: authUser?.image || formData.image,
      });
      resetPasswordFields();
      setSaveError('');
    }
    setIsEditing((v) => !v);
  };

  const handleSave = async () => {
    setSaveError('');

    if (requiresCurrentPassword && !passwordData.currentPassword) {
      setSaveError(
        isRtl
          ? 'يرجى إدخال كلمة المرور الحالية لتأكيد تغيير البريد الإلكتروني أو كلمة المرور.'
          : 'Please enter your current password to confirm changing your email or password.'
      );
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        image: formData.image,
      };

      if (requiresCurrentPassword) {
        payload.currentPassword = passwordData.currentPassword;
      }

      if (wantsPasswordChange) {
        payload.password = passwordData.newPassword;
      }

      const { data } = await api.put('/auth/profile', payload);
      const updatedUser = data?.user || data;

      setFormData({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        bio: updatedUser.bio || '',
        image: updatedUser.image || formData.image,
      });

      if (typeof updateUser === 'function') {
        updateUser(updatedUser);
      }

      resetPasswordFields();
      setIsEditing(false);
      showNotification(t('profile.profileUpdated'), 'success');
    } catch (error) {
      const message = getErrorMessage(error, t('profile.updateFailed'));
      setSaveError(message);
      showNotification(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(t('profile.cancelBookingPrompt'))) return;
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status: 'cancelled' } : b)));
      showNotification(t('profile.bookingCancelled'), 'success');
    } catch {
      showNotification(t('profile.cancellationFailed'), 'error');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await api.delete('/users/profile');
      logout();
      navigate('/');
    } catch {
      showNotification(t('profile.deleteFailed'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateSafely = (dateString, formatStr) => {
    try {
      if (!dateString) return '';
      return format(new Date(dateString), formatStr, { locale: arMA });
    } catch {
      return '';
    }
  };

  return (
    <main className="min-h-screen bg-bg-gray px-4 py-8 sm:px-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-semibold text-airbnb-dark">{t('profile.title')}</h1>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="relative mx-auto mb-4 h-28 w-28">
              <img src={formData.image} alt={t('profile.title')} className="h-full w-full rounded-full object-cover" />
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 rounded-full border border-gray-200 bg-white p-2 shadow-sm" type="button">
                <Camera size={16} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
            <h2 className="text-xl font-semibold text-airbnb-dark">{formData.name}</h2>
            <p className="text-sm text-gray-500">{formData.email}</p>
            <button onClick={handleToggleEdit} className="mt-4 w-full rounded-xl border border-[#2DB4A0] py-2 text-sm font-semibold text-[#2DB4A0] hover:bg-[#2DB4A0]/5" type="button">
              {isEditing ? t('profile.cancelEdit') : t('profile.editProfile')}
            </button>
          </div>

          <div className="space-y-6 md:col-span-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-airbnb-dark">{t('profile.personalInfo')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('profile.name')}</label>
                  <div className="relative">
                    <User className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} text-gray-400`} size={18} />
                    <input disabled={!isEditing} value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className={`w-full rounded-xl border border-gray-300 bg-white p-3 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} outline-none focus:border-[#2DB4A0] disabled:bg-gray-50`} />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{t('profile.email')}</label>
                  <div className="relative">
                    <Mail className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} text-gray-400`} size={18} />
                    <input disabled={!isEditing} value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} className={`w-full rounded-xl border border-gray-300 bg-white p-3 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} outline-none focus:border-[#2DB4A0] disabled:bg-gray-50`} />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{t('profile.bio')}</label>
                  <textarea disabled={!isEditing} value={formData.bio} onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-[#2DB4A0] disabled:bg-gray-50" />
                </div>

                {isEditing && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        {isRtl ? 'كلمة مرور جديدة (اختياري)' : 'New password (optional)'}
                      </label>
                      <div className="relative">
                        <Lock className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} text-gray-400`} size={18} />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                          placeholder={isRtl ? 'اتركها فارغة إذا لم ترغب بتغييرها' : 'Leave empty to keep current password'}
                          className={`w-full rounded-xl border border-gray-300 bg-white p-3 ${isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'} outline-none focus:border-[#2DB4A0]`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((v) => !v)}
                          className={`absolute top-3 text-gray-400 hover:text-gray-600 ${isRtl ? 'left-3' : 'right-3'}`}
                          tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {requiresCurrentPassword && (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-amber-700">
                          {isRtl
                            ? 'كلمة المرور الحالية (مطلوبة لتأكيد التغيير)'
                            : 'Current password (required to confirm this change)'}
                        </label>
                        <div className="relative">
                          <Lock className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} text-gray-400`} size={18} />
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                            className={`w-full rounded-xl border p-3 outline-none focus:border-[#2DB4A0] ${isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'} border-amber-300 bg-amber-50/50`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword((v) => !v)}
                            className={`absolute top-3 text-gray-400 hover:text-gray-600 ${isRtl ? 'left-3' : 'right-3'}`}
                            tabIndex={-1}
                          >
                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {saveError && (
                      <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{saveError}</p>
                    )}

                    <button onClick={handleSave} disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2DB4A0] py-3 font-bold text-white hover:bg-[#249181] disabled:opacity-70" type="button">
                      {isSaving && <Loader2 className="animate-spin" size={18} />}
                      {t('profile.saveChanges')}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-airbnb-dark">{t('profile.myBookings')}</h3>

              {bookingsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#2DB4A0]" /></div>
              ) : bookings.length === 0 ? (
                <p className="text-sm text-gray-500">{t('profile.noBookings')}</p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-airbnb-dark">{booking.listing?.title || t('profile.stay')}</p>
                          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                            <Calendar size={14} />
                            {formatDateSafely(booking.startDate, 'dd MMM')} - {formatDateSafely(booking.endDate, 'dd MMM yyyy')}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${booking.status === 'confirmed' ? 'bg-[#2DB4A0]/10 text-[#2DB4A0]' : booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {t(`bookingsTable.${booking.status}`)}
                        </span>
                      </div>

                      {booking.status === 'confirmed' && (
                        <button onClick={() => handleCancelBooking(booking._id)} className="mt-3 text-sm font-semibold text-red-600 underline" type="button">{t('profile.cancelBooking')}</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-airbnb-dark">{t('profile.wishlist')}</h3>
              {wishlist.length === 0 ? (
                <p className="text-sm text-gray-500">{t('profile.noWishlist')}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {wishlist.map((item) => (
                    <Link key={item._id} to={`/listing/${item._id}`} className="rounded-2xl border border-gray-200 p-3 hover:shadow-sm">
                      <img src={getImageUrl(item.image)} alt={item.title} className="mb-2 h-32 w-full rounded-xl object-cover" />
                      <p className="font-semibold text-airbnb-dark">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.city}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-700"><Heart size={14} className="fill-[#f68f1f] text-[#f68f1f]" /> {item.rating || 4.8}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-airbnb-dark">{t('profile.settings')}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"><Globe size={16} /> {t('profile.language')}</label>
                  <select value={appLanguage} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#2DB4A0]">
                    <option value="ar">{t('profile.availableLanguages.ar')}</option>
                    <option value="en">{t('profile.availableLanguages.en')}</option>
                    <option value="fr">{t('profile.availableLanguages.fr')}</option>
                    <option value="es">{t('profile.availableLanguages.es')}</option>
                    <option value="de">{t('profile.availableLanguages.de')}</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-gray-200 p-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"><Coins size={16} /> {t('profile.currency')}</label>
                  <select value={currency.code} onChange={(e) => { const selected = currencyOptions.find((c) => c.code === e.target.value); if (selected) setCurrency(selected); }} className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#2DB4A0]">
                    {currencyOptions.map((c) => (<option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-red-700"><Trash2 size={18} /> {t('profile.deleteAccount')}</h3>
              <p className="mb-4 text-sm text-red-600">{t('profile.deleteAccountDesc')}</p>
              <button onClick={() => setShowDeleteModal(true)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700" type="button">{t('profile.deleteAccount')}</button>
            </div>
          </div>
        </section>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center">
            <h4 className="mb-2 text-xl font-semibold">{t('profile.confirmDeleteAccount')}</h4>
            <p className="mb-5 text-sm text-gray-600">{t('profile.confirmDeleteAccountMsg')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 rounded-xl border border-gray-300 py-2 font-semibold disabled:opacity-50" type="button">{t('profile.cancel')}</button>
              <button onClick={handleDeleteAccount} disabled={isDeleting} className="flex-1 rounded-xl bg-red-600 py-2 font-semibold text-white disabled:opacity-70" type="button">{isDeleting ? <Loader2 className="mx-auto animate-spin" size={18} /> : t('profile.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProfilePage;