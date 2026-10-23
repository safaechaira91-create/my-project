﻿﻿import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ChevronLeft, ChevronRight, Home as HomeIcon, Bed, Sparkles, Building, Wind, Inbox } from 'lucide-react';
import propertyService from '../../services/propertyService';
import wishlistService from '../../services/wishlistService';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import Skeleton from '../../components/Skeleton';
import { Helmet } from 'react-helmet-async';
import { getListingImage } from '../../utils/images';

const categories = [
  { key: 'trending', ar: 'نشط الآن', en: 'Trending', icon: Sparkles },
  { key: 'rooms', ar: 'غرف', en: 'Rooms', icon: Bed },
  { key: 'cities', ar: 'مدن شهيرة', en: 'Cities', icon: Building },
  { key: 'beach', ar: 'على البحر', en: 'Beachfront', icon: Wind },
  { key: 'pools', ar: 'مسابح', en: 'Pools', icon: HomeIcon },
];

const HomePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { isRtl, language, showNotification } = useAppContext();
  const { t } = useTranslation();
  const userId = user?._id || user?.uid;

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [activeCategory, setActiveCategory] = useState('trending');

  const row1Ref = useRef(null);
  const row2Ref = useRef(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        // Uses propertyService (/api/properties) which correctly filters
        // to only approved & available listings.
        const data = await propertyService.getProperties();
        if (data?.listings && data.listings.length > 0) {
          setListings(data.listings);
        } else {
          setListings([]);
        }
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (authLoading) return;
      if (!userId) {
        setWishlistIds([]);
        return;
      }

      try {
        const items = await wishlistService.getWishlist();
        setWishlistIds(items.map((x) => x._id));
      } catch {
        setWishlistIds([]);
      }
    };

    fetchWishlist();
  }, [userId, authLoading]);

  // Filtering listings based on selected category
  const filteredListings = useMemo(() => {
    if (activeCategory === 'trending') return listings;
    return listings.filter((item) => 
      item.category?.toLowerCase() === activeCategory || 
      item.type?.toLowerCase() === activeCategory
    );
  }, [listings, activeCategory]);

  const cards = useMemo(() => filteredListings.slice(0, 12), [filteredListings]);
  const section1 = useMemo(() => cards.slice(0, 6), [cards]);
  const section2 = useMemo(() => (cards.length > 6 ? cards.slice(6, 12) : []), [cards]);

  const scrollRow = (ref, dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * 540, behavior: 'smooth' });
  };

  const toggleWishlist = async (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      showNotification(
        language === 'ar' ? 'سجل الدخول أولاً لإضافة المفضلة' : 'Log in first to save wishlist items',
        'error'
      );
      return;
    }

    const isCurrentlyActive = wishlistIds.includes(itemId);
    
    // Optimistic UI Update
    setWishlistIds(prev => 
      isCurrentlyActive ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );

    try {
      if (isCurrentlyActive) {
        await wishlistService.removeWishlistItem(itemId);
      } else {
        await wishlistService.addWishlistItem(itemId);
      }
    } catch {
      // Revert if error
      setWishlistIds(prev => 
        isCurrentlyActive ? [...prev, itemId] : prev.filter(id => id !== itemId)
      );
      showNotification(
        language === 'ar' ? 'تعذر تحديث المفضلة' : 'Could not update wishlist',
        'error'
      );
    }
  };

  const text = {
    homes: t('home.greatHomes') || (language === 'ar' ? 'بيوت رائعة في مراكش' : 'Great homes in Marrakech'),
    hotels: t('home.hotelDeals') || (language === 'ar' ? 'عروض رائعة على الفنادق' : 'Great hotel deals'),
    guestFav: t('home.guestFavorite') || (language === 'ar' ? 'مفضل لدى الضيوف' : 'Guest favorite'),
    empty: language === 'ar' ? 'لا توجد عروض متوفرة حالياً في هذه الفئة' : 'No listings available in this category',
  };

  const renderRow = (items, ref) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollRow(ref, isRtl ? 1 : -1)}
        className="absolute -left-2 top-28 z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-md transition hover:bg-gray-50 dark:hover:bg-gray-700 md:flex cursor-pointer"
      >
        {isRtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <button
        type="button"
        onClick={() => scrollRow(ref, isRtl ? -1 : 1)}
        className="absolute -right-2 top-28 z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-md transition hover:bg-gray-50 dark:hover:bg-gray-700 md:flex cursor-pointer"
      >
        {isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const active = wishlistIds.includes(item._id);
          const imageUrl = getListingImage(item);
          return (
            <Link
              key={item._id}
              to={`/listing/${item._id}`}
              className="group w-70 min-w-70 max-w-70 sm:w-75 sm:min-w-75"
            >
              <div className="relative mb-3 overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-800">
                <img
                  loading="lazy"
                  src={imageUrl}
                  alt={item.title}
                  className="h-55 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-sm">
                  {text.guestFav}
                </span>

                <button
                  type="button"
                  onClick={(e) => toggleWishlist(e, item._id)}
                  className="absolute left-3 top-3 rounded-full bg-black/40 backdrop-blur-xs p-2 text-white hover:bg-black/60 transition cursor-pointer"
                >
                  <Heart className={`h-4 w-4 ${active ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                </button>
              </div>

              <div className={isRtl ? 'text-right' : 'text-left'}>
                <h3 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">{item.rating || 4.8}</span>
                  <span>·</span>
                  <span>MAD {item.price}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">/ {language === 'ar' ? 'ليلة' : 'night'}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>MyDar - {language === 'ar' ? 'الرئيسية' : 'Home'}</title>
      </Helmet>

      <main className="min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-16 transition-colors" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Category Navigation Bar */}
        <section className="sticky top-0 z-20 border-b border-gray-100 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-345 items-center justify-start sm:justify-center gap-6 sm:gap-10 overflow-x-auto px-4 sm:px-8 py-3.5 flex-nowrap scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex flex-col items-center gap-2 border-b-2 px-2 pb-2 text-sm font-semibold transition-all shrink-0 min-w-16 cursor-pointer ${
                    active
                      ? 'border-[#2DB4A0] text-[#2DB4A0]'
                      : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-xs">{language === 'ar' ? cat.ar : cat.en}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Listing Sections */}
        <section className="mx-auto max-w-345 px-4 pt-8 md:px-8">
          {loading ? (
            <div className="space-y-10">
              <div>
                <Skeleton className="mb-4 h-8 w-64 rounded-xl" />
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-3xl" />
                  ))}
                </div>
              </div>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-4 text-gray-400 mb-4">
                <Inbox size={40} />
              </div>
              <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">{text.empty}</p>
            </div>
          ) : (
            <div className="space-y-12">
              <section>
                <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                  {text.homes}
                </h2>
                {renderRow(section1, row1Ref)}
              </section>

              {section2.length > 0 && (
                <section>
                  <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                    {text.hotels}
                  </h2>
                  {renderRow(section2, row2Ref)}
                </section>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default HomePage;