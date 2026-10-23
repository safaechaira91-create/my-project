import { useState } from 'react';
import { Star, Heart, Share2, MapPin, ShieldCheck, UserCheck, Check } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useAppContext } from '../context/AppContext.jsx';
import { getImageUrl } from '../utils/images';

const ListingDetails = ({ listing, onBookNow }) => {
  const { t, isRtl } = useTranslation();
  const { currency, language } = useAppContext();
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!listing) {
    return (
      <div className="flex min-h-100 items-center justify-center text-gray-500">
        {t('common.noDetailsFound', 'لا تتوفر تفاصيل عن هذا العقار.')}
      </div>
    );
  }

  const {
    title,
    description,
    images = [],
    rating = '0.0',
    reviewsCount = 0,
    location,
    pricePerNight = 0,
    host = {},
    amenities = [],
  } = listing;

  const numericPrice = Number(pricePerNight) || 0;
  
  // Dynamic currency logic or direct display
  const displayedPrice = numericPrice; 
  const formattedPrice = displayedPrice.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  const displaySymbol = language === 'en' && currency?.code === 'MAD' ? 'MAD' : currency?.symbol || 'MAD';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share dialog is canceled or unsupported
      }
    }
    
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{title}</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-700">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold">
              <Star size={16} className="fill-black text-black" />
              {rating}
            </span>
            <span>·</span>
            <span className="underline">{reviewsCount} {t('common.reviews', 'تقييم')}</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-gray-600">
              <MapPin size={16} />
              {location}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleShare}
              aria-label={t('common.share', 'مشاركة')}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition"
            >
              {copied ? <Check size={18} className="text-green-600" /> : <Share2 size={18} />}
              <span className="underline font-medium">
                {copied ? t('common.copied', 'تم النسخ!') : t('common.share', 'مشاركة')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              aria-label={t('common.save', 'حفظ')}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition"
            >
              <Heart
                size={18}
                className={isFavorite ? 'fill-red-500 text-red-500' : ''}
              />
              <span className="underline font-medium">{t('common.save', 'حفظ')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-2xl md:grid-cols-4 md:grid-rows-2 md:h-105">
        <div className="md:col-span-2 md:row-span-2 relative h-70 md:h-full bg-gray-100">
          <img
            src={getImageUrl(images[0]) || '/placeholder.jpg'}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        {images.slice(1, 5).map((img, idx) => (
          <div key={idx} className="hidden md:block relative h-full bg-gray-100">
            <img
              src={getImageUrl(img) || '/placeholder.jpg'}
              alt={`${title} ${idx + 2}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b pb-6">
            <div>
              <h2 className="text-xl font-bold">
                {t('common.hostedBy', 'المضيف')}: {host.name || 'Host'}
              </h2>
              <p className="text-sm text-gray-500">
                {host.superhost ? t('common.superhost', 'مضيف متميز') : t('common.experiencedHost', 'مضيف معتمد')}
              </p>
            </div>
            {host.avatar && (
              <img
                src={getImageUrl(host.avatar)}
                alt={host.name}
                loading="lazy"
                className="h-14 w-14 rounded-full object-cover border"
              />
            )}
          </div>

          <div className="border-b pb-6 space-y-4">
            <div className="flex items-start gap-4">
              <ShieldCheck size={24} className="text-[#2DB4A0] shrink-0 mt-1" />
              <div>
                <h3 className="font-bold">{t('common.protectionTitle', 'حماية حجزك')}</h3>
                <p className="text-sm text-gray-600">
                  {t('common.protectionDesc', 'كل حجز يتضمن حماية مجانية من إلغاء المضيف وعدم تطابق المواصفات.')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <UserCheck size={24} className="text-[#2DB4A0] shrink-0 mt-1" />
              <div>
                <h3 className="font-bold">{t('common.selfCheckIn', 'دخول ذاتي')}</h3>
                <p className="text-sm text-gray-600">
                  {t('common.selfCheckInDesc', 'يمكنك تسجيل الوصول بسهولة باستخدام الرمز الإلكتروني.')}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-b pb-6">
            <h3 className="mb-3 text-lg font-bold">{t('common.aboutSpace', 'عن هذا المكان')}</h3>
            <p className="whitespace-pre-line leading-relaxed text-gray-700">{description}</p>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-bold">{t('common.amenities', 'ما يوفره المكان')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {amenities.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700">
                    <span className="h-2 w-2 rounded-full bg-[#2DB4A0]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Booking Card */}
        <div className="relative">
          <div className="sticky top-28 rounded-2xl border border-gray-200 p-6 shadow-xl bg-white">
            <div className="flex items-baseline justify-between border-b pb-4 mb-4">
              <div>
                <span className="text-2xl font-bold">{formattedPrice} {displaySymbol}</span>
                <span className="text-sm text-gray-600"> / {t('common.night', 'ليلة')}</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold">
                <Star size={14} className="fill-black text-black" />
                {rating}
              </div>
            </div>

            <button
              type="button"
              onClick={onBookNow}
              className="w-full rounded-xl bg-[#2DB4A0] py-3.5 font-bold text-white transition hover:bg-[#249181] active:scale-[0.98]"
            >
              {t('common.reserve', 'احجز الآن')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;