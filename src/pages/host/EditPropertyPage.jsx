import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import propertyService from '../../services/propertyService';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/errorMessage';

// NOTE: These must match exactly what the backend's normalizeCategory()
// accepts (see propertyController.js). Do NOT use config/constants.js's
// CATEGORIES/AMENITIES here - those use different ids (e.g. 'traditional',
// 'airConditioning') that the backend rejects with "Invalid property category".
const CATEGORIES = ['Apartment', 'Villa', 'Riad', 'House', 'Cabin'];
const AMENITIES = ['wifi', 'parking', 'pool', 'kitchen', 'ac', 'tv'];

const EditPropertyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isRtl } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(null);

  // جلب البيانات مع حماية من Memory Leaks (isMounted Cleanup)
  useEffect(() => {
    let isMounted = true;

    const loadProperty = async () => {
      try {
        const data = await propertyService.getPropertyById(id);
        if (isMounted) {
          setFormData({
            title: data.title || '',
            description: data.description || '',
            price: data.price || 0,
            category: data.category || 'Apartment',
            guests: data.guests || 1,
            bedrooms: data.bedrooms || 1,
            bathrooms: data.bathrooms || 1,
            location: {
              city: data.location?.city || '',
              address: data.location?.address || '',
            },
            amenities: data.amenities || [],
            images: data.images || [],
            availability: data.availability ?? true,
          });
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(
            getErrorMessage(
              err,
              t('propertyForm.loadFailed') || (isRtl ? 'فشل تحميل بيانات العقار' : 'Failed to load property details')
            )
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProperty();

    return () => {
      isMounted = false;
    };
  }, [id, t, isRtl]);

  // إدارة تغيير المدخلات
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
      if (error) setError('');
      return;
    }

    if (name === 'availability') {
      setFormData((prev) => ({ ...prev, availability: checked }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
    if (error) setError('');
  };

  // إدارة تغيير التجهيزات
  const handleAmenityToggle = (amenityId) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenityId);
      const updated = exists
        ? prev.amenities.filter((id) => id !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities: updated };
    });
  };

  // حفظ دالة تغيير الصور بـ useCallback لمنع إعادة الـ Render غير الضرورية
  const handleImagesChange = useCallback((images) => {
    setFormData((prev) => ({ ...prev, images }));
  }, []);

  // إرسال التعديلات
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError(isRtl ? 'يرجى إدخال عنوان العقار.' : 'Please enter a property title.');
      return;
    }

    if (!formData.location.city.trim()) {
      setError(isRtl ? 'يرجى إدخال المدينة.' : 'Please enter the city.');
      return;
    }

    if (!formData.images || formData.images.length === 0) {
      setError(isRtl ? 'يرجى إضافة صورة واحدة على الأقل.' : 'Please add at least one image.');
      return;
    }

    setSaving(true);

    try {
      await propertyService.updateProperty(id, formData);
      navigate(`/properties/${id}`);
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(
          err,
          t('propertyForm.updateFailed') || (isRtl ? 'حدث خطأ أثناء تعديل العقار' : 'Error updating property')
        )
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28" dir={isRtl ? 'rtl' : 'ltr'}>
        <Loader2 className="animate-spin text-[#2DB4A0]" size={36} />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="py-20 text-center font-semibold text-gray-700 dark:text-gray-300" dir={isRtl ? 'rtl' : 'ltr'}>
        {error || t('propertyForm.notFound') || (isRtl ? 'العقار غير موجود' : 'Property not found')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 transition-all" dir={isRtl ? 'rtl' : 'ltr'}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
        {t('common.back') || (isRtl ? 'رجوع' : 'Back')}
      </button>

      <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
        {t('propertyForm.editTitle') || (isRtl ? 'تعديل بيانات العقار' : 'Edit Property')}
      </h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        {t('propertyForm.editSubtitle') || (isRtl ? 'قم بتحديث معلومات العقار والصور وتفاصيل الحجز.' : 'Update details, pricing, and images for your listing.')}
      </p>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm font-semibold text-rose-700 dark:text-rose-400">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-sm">
        {/* Title */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('propertyForm.title') || (isRtl ? 'عنوان العقار' : 'Property Title')}
          </label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength={150}
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] dark:focus:border-[#2DB4A0] transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('propertyForm.description') || (isRtl ? 'الوصف' : 'Description')}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
            maxLength={5000}
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] dark:focus:border-[#2DB4A0] transition"
          />
        </div>

        {/* Price & Category */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('propertyForm.price') || (isRtl ? 'السعر (لكل ليلة)' : 'Price (per night)')}
            </label>
            <input
              name="price"
              type="number"
              min="1"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] dark:focus:border-[#2DB4A0] transition"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('propertyForm.category') || (isRtl ? 'نوع العقار' : 'Category')}
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] dark:focus:border-[#2DB4A0] transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`propertyForm.categories.${cat.toLowerCase()}`) || cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Capacity */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('propertyForm.guests') || (isRtl ? 'عدد الضيوف' : 'Guests')}
            </label>
            <input
              name="guests"
              type="number"
              min="1"
              value={formData.guests}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] transition"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('propertyForm.bedrooms') || (isRtl ? 'غرف النوم' : 'Bedrooms')}
            </label>
            <input
              name="bedrooms"
              type="number"
              min="1"
              value={formData.bedrooms}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] transition"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('propertyForm.bathrooms') || (isRtl ? 'الدورات المياه' : 'Bathrooms')}
            </label>
            <input
              name="bathrooms"
              type="number"
              min="1"
              value={formData.bathrooms}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] transition"
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('propertyForm.city') || (isRtl ? 'المدينة' : 'City')}
            </label>
            <input
              name="location.city"
              value={formData.location.city}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] transition"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('propertyForm.address') || (isRtl ? 'العنوان' : 'Address')}
            </label>
            <input
              name="location.address"
              value={formData.location.address}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] transition"
            />
          </div>
        </div>

        {/* Amenities Selection */}
        <div>
          <label className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('propertyForm.amenities') || (isRtl ? 'المرافق والتجهيزات' : 'Amenities')}
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AMENITIES.map((amenity) => {
              const isSelected = formData.amenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`flex items-center gap-2 rounded-2xl border p-3.5 text-xs font-semibold transition ${
                    isSelected
                      ? 'border-[#2DB4A0] bg-[#2DB4A0]/10 text-[#2DB4A0] dark:bg-[#2DB4A0]/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="capitalize">{t(`propertyForm.amenitiesLabels.${amenity}`) || amenity}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Image Uploader */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('propertyForm.propertyImages') || (isRtl ? 'صور العقار' : 'Property Images')}
          </label>
          <ImageUploader
            initialImages={formData.images}
            onImagesChange={handleImagesChange}
          />
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="availability"
            name="availability"
            checked={formData.availability}
            onChange={handleChange}
            className="h-5 w-5 rounded border-gray-300 text-[#2DB4A0] focus:ring-[#2DB4A0]"
          />
          <label htmlFor="availability" className="cursor-pointer text-sm font-semibold text-gray-800 dark:text-gray-200">
            {t('propertyForm.availableForBooking') || (isRtl ? 'متاح للحجز المباشر' : 'Available for direct booking')}
          </label>
        </div>

        {/* Warning about re-review */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs font-medium text-amber-800 dark:text-amber-400">
          {isRtl
            ? 'ملاحظة: تعديل عقار معتمد سيعيده إلى قائمة المراجعة قبل أن يظهر مجدداً للزوار.'
            : 'Note: editing an approved property will send it back for review before it appears to guests again.'}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DB4A0] py-3.5 font-bold text-white shadow-lg shadow-[#2DB4A0]/20 transition hover:bg-[#249181] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {saving
            ? t('propertyForm.saving') || (isRtl ? 'جاري الحفظ...' : 'Saving...')
            : t('propertyForm.saveChanges') || (isRtl ? 'حفظ التغييرات' : 'Save Changes')}
        </button>
      </form>
    </div>
  );
};

export default EditPropertyPage;