import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Home, MapPin, DollarSign, Image as ImageIcon, AlertCircle } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import propertyService from '../../services/propertyService';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorMessage';

const AMENITIES = ['wifi', 'parking', 'pool', 'kitchen', 'ac', 'tv'];
const CATEGORIES = ['Apartment', 'Villa', 'Riad', 'House', 'Cabin'];

const AddPropertyPage = () => {
  const navigate = useNavigate();
  const { t, isRtl } = useTranslation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Apartment',
    guests: 1,
    bedrooms: 1,
    bathrooms: 1,
    location: { city: '', address: '' },
    images: [],
    amenities: [],
    availability: true,
  });

  const canManageProperties = user?.role === 'host' || user?.role === 'admin';

  // Memoized image change handler to prevent redundant render cycles
  const handleImagesChange = useCallback((urls) => {
    setFormData((prev) => {
      if (prev.images.length === urls.length && prev.images.every((url, index) => url === urls[index])) {
        return prev;
      }
      return { ...prev, images: urls };
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested objects (e.g. location.city)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent] || {}),
          [child]: value,
        },
      }));
      if (error) setError('');
      return;
    }

    // Handle amenities checkboxes
    if (name === 'amenities') {
      setFormData((prev) => ({
        ...prev,
        amenities: checked
          ? [...prev.amenities, value]
          : prev.amenities.filter((item) => item !== value),
      }));
      return;
    }

    // Handle standard boolean checkboxes
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    // Handle standard input fields
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError(isRtl ? 'يرجى إدخال عنوان العقار.' : 'Please enter a property title.');
      return;
    }

    if (!formData.description.trim()) {
      setError(isRtl ? 'يرجى إدخال وصف العقار.' : 'Please enter a property description.');
      return;
    }

    if (!formData.location.city.trim()) {
      setError(isRtl ? 'يرجى إدخال المدينة.' : 'Please enter the city.');
      return;
    }

    if (!formData.images || formData.images.length === 0) {
      setError(
        t('propertyForm.imageRequired') ||
          (isRtl ? 'يرجى إضافة صورة واحدة على الأقل للدار.' : 'Please add at least one image.')
      );
      return;
    }

    if (Number(formData.price) <= 0 || Number.isNaN(Number(formData.price))) {
      setError(isRtl ? 'يرجى إدخال سعر ليلة صحيح.' : 'Please enter a valid price.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        guests: Number(formData.guests) || 1,
        bedrooms: Number(formData.bedrooms) || 1,
        bathrooms: Number(formData.bathrooms) || 1,
      };

      const created = await propertyService.createProperty(payload);
      navigate(`/properties/${created._id}`);
    } catch (err) {
      console.error('Failed to create property:', err);
      setError(
        getErrorMessage(
          err,
          t('propertyForm.createFailed') || (isRtl ? 'فشل في نشر الدار، حاول مرة أخرى.' : 'Failed to create property.')
        )
      );
    } finally {
      setLoading(false);
    }
  };

  if (!canManageProperties) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('support.accessDenied') || 'غير مسموح بالوصول'}</h1>
          <p className="mt-2 text-gray-600">
            {isRtl ? 'خاصك تكون حساب مضيف باش تقدر تضيف عقار جديد.' : 'You need a host account to publish properties.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full rounded-xl bg-[#2DB4A0] py-3 font-semibold text-white transition hover:bg-[#249181]"
          >
            {isRtl ? 'الرجوع للرئيسية' : 'Back to Home'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#f7f7f7] px-4 py-10" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        
        {/* Header */}
        <div className="border-b border-gray-200 bg-[#2DB4A0] px-6 py-8 text-white md:px-10">
          <h1 className="text-3xl font-black">{t('propertyForm.addTitle')}</h1>
          <p className="mt-2 text-white/90">{t('propertyForm.addSubtitle')}</p>
        </div>

        <div className="p-6 md:p-10">
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="shrink-0" size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title and Price */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="font-semibold text-[#222222]">{t('propertyForm.title')}</label>
                <div className="relative">
                  <Home size={18} className={`absolute top-3.5 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                  <input
                    name="title"
                    required
                    maxLength={150}
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full rounded-xl border border-gray-300 py-3 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} outline-none focus:border-[#2DB4A0] transition`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[#222222]">{t('propertyForm.pricePerNight')}</label>
                <div className="relative">
                  <DollarSign size={18} className={`absolute top-3.5 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                  <input
                    name="price"
                    type="number"
                    min="1"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full rounded-xl border border-gray-300 py-3 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} outline-none focus:border-[#2DB4A0] transition`}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="font-semibold text-[#222222]">{t('propertyForm.description')}</label>
              <textarea
                name="description"
                required
                rows="4"
                maxLength={5000}
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#2DB4A0] transition"
              />
              <p className="text-xs text-gray-400 text-end">{formData.description.length}/5000</p>
            </div>

            {/* Location */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="font-semibold text-[#222222]">{t('propertyForm.city')}</label>
                <div className="relative">
                  <MapPin size={18} className={`absolute top-3.5 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                  <input
                    name="location.city"
                    required
                    value={formData.location.city}
                    onChange={handleChange}
                    className={`w-full rounded-xl border border-gray-300 py-3 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} outline-none focus:border-[#2DB4A0] transition`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[#222222]">{t('propertyForm.address')}</label>
                <input
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#2DB4A0] transition"
                />
              </div>
            </div>

            {/* Category & Availability */}
            <div className="grid gap-6 md:grid-cols-2 items-center">
              <div className="space-y-2">
                <label className="font-semibold text-[#222222]">{t('propertyForm.category')}</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#2DB4A0] transition"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {t(`propertyForm.categories.${category.toLowerCase()}`) || category}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 font-medium text-[#222222] cursor-pointer mt-2 md:mt-7">
                <input
                  type="checkbox"
                  name="availability"
                  checked={formData.availability}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-gray-300 text-[#2DB4A0] focus:ring-[#2DB4A0]"
                />
                <span>{t('propertyForm.availableForBooking')}</span>
              </label>
            </div>

            {/* Capacity */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {['guests', 'bedrooms', 'bathrooms'].map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium capitalize text-[#222222]">
                    {t(`propertyForm.${field}`)}
                  </label>
                  <input
                    name={field}
                    type="number"
                    min="1"
                    value={formData[field]}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#2DB4A0] transition"
                  />
                </div>
              ))}
            </div>

            {/* Amenities */}
            <div>
              <p className="mb-3 font-semibold text-[#222222]">{t('propertyForm.amenities')}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {AMENITIES.map((amenity) => (
                  <label key={amenity} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 text-sm transition hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="amenities"
                      value={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-[#2DB4A0] focus:ring-[#2DB4A0]"
                    />
                    <span className="capitalize">{t(`propertyForm.amenitiesLabels.${amenity}`) || amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Image Upload Component */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-semibold text-[#222222]">
                <ImageIcon size={18} />
                {t('propertyForm.propertyImages')}
              </label>
              <ImageUploader onImagesChange={handleImagesChange} />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DB4A0] py-4 text-lg font-bold text-white transition hover:bg-[#249181] active:scale-[0.99] disabled:opacity-70 shadow-lg shadow-[#2DB4A0]/20"
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : <Plus size={22} />}
              {t('propertyForm.publishProperty')}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default AddPropertyPage;