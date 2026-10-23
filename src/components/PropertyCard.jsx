import { useEffect, useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import wishlistService from '../services/wishlistService';
import { getListingImage } from '../utils/images';

// When `isWishlisted`/`onToggleWishlist` props are provided by a parent page
// (recommended - see Home.jsx), the card is fully controlled and does NOT
// fetch the wishlist itself. This avoids one API call per card (N+1 problem)
// when rendering a grid of properties. If the props are omitted, the card
// falls back to managing its own wishlist state (legacy behavior, used by
// pages that haven't been updated to lift this state up yet).
const PropertyCard = ({ property, isWishlisted, onToggleWishlist }) => {
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useAppContext();
  const { t } = useTranslation();
  const userId = user?._id || user?.uid;

  const isControlled = typeof isWishlisted === 'boolean' && typeof onToggleWishlist === 'function';

  const [localActive, setLocalActive] = useState(false);
  const active = isControlled ? isWishlisted : localActive;

  const city =
    property?.location?.city ||
    (typeof property?.location === 'string' ? property.location : null) ||
    'Morocco';

  const cover = getListingImage(property);

  // Fallback fetch: only runs when this card is NOT controlled by a parent.
  useEffect(() => {
    if (isControlled) return;

    let isMounted = true;

    const fetchWishlistState = async () => {
      if (authLoading || !user || !userId) {
        if (isMounted) setLocalActive(false);
        return;
      }

      try {
        const wishlist = await wishlistService.getWishlist();
        if (isMounted) {
          const isItemSaved = Array.isArray(wishlist) && wishlist.some((item) => item._id === property?._id);
          setLocalActive(isItemSaved);
        }
      } catch {
        if (isMounted) setLocalActive(false);
      }
    };

    fetchWishlistState();

    return () => {
      isMounted = false;
    };
  }, [userId, property?._id, authLoading, user, isControlled]);

  const handleWishlistClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      showNotification(t('property.loginToSaveWishlist'), 'error');
      return;
    }

    // Controlled mode: delegate entirely to the parent page.
    if (isControlled) {
      onToggleWishlist(property._id, active);
      return;
    }

    // Legacy uncontrolled mode: manage the API call locally.
    const previousState = active;
    setLocalActive(!previousState);

    try {
      const nextItems = previousState
        ? await wishlistService.removeWishlistItem(property._id)
        : await wishlistService.addWishlistItem(property._id);

      if (Array.isArray(nextItems)) {
        setLocalActive(nextItems.some((item) => item._id === property._id));
      }
    } catch {
      setLocalActive(previousState);
      showNotification(t('property.wishlistUpdateError'), 'error');
    }
  }, [userId, active, property?._id, showNotification, t, isControlled, onToggleWishlist]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="group relative cursor-pointer mb-6 md:mb-0"
    >
      <Link to={`/listing/${property?._id}`}>
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition duration-300 group-hover:shadow-lg">
          <img 
            src={cover} 
            alt={property?.title || 'Property'} 
            loading="lazy" 
            decoding="async" 
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105" 
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/30 to-transparent" />
          
          <button
            type="button"
            onClick={handleWishlistClick}
            className="absolute inset-e-3 top-3 rounded-full bg-white/90 p-2 shadow-md transition hover:scale-110 focus:outline-none backdrop-blur-sm"
            aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={18} className={active ? 'fill-red-500 text-red-500' : 'text-gray-700'} />
          </button>
        </div>

        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold text-gray-900">{property?.title || 'Untitled Property'}</h3>
            <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <MapPin size={14} className="shrink-0" /> 
              <span className="truncate">{city}</span>
            </p>
            <p className="mt-1 text-sm">
              <span className="font-bold">{property?.price?.toLocaleString() || 0} MAD</span> / {t('common.night')}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs shadow-sm border border-gray-100 shrink-0">
            <Star size={14} className="fill-yellow-400 text-yellow-400" /> 
            <span className="font-semibold">
              {property?.rating ? Number(property.rating).toFixed(1) : t('property.new')}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default memo(PropertyCard);