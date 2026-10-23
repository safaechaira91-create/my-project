// زيدي هاد الاستيرادات فوق:
import { useAuth } from '../../context/AuthContext';
import wishlistService from '../../services/wishlistService';

// جوا الكومبونونت، زيدي:
const { user } = useAuth();
const userId = user?._id || user?.uid;
const [wishlistIds, setWishlistIds] = useState([]);

useEffect(() => {
  const fetchWishlist = async () => {
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
}, [userId]);

const handleToggleWishlist = useCallback(async (propertyId, wasActive) => {
  setWishlistIds((prev) =>
    wasActive ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
  );
  try {
    if (wasActive) {
      await wishlistService.removeWishlistItem(propertyId);
    } else {
      await wishlistService.addWishlistItem(propertyId);
    }
  } catch {
    setWishlistIds((prev) =>
      wasActive ? [...prev, propertyId] : prev.filter((id) => id !== propertyId)
    );
  }
}, []);

// وفـ الـ render، بدلي:
// <PropertyCard key={item._id} property={item} />
// بـ:
<PropertyCard
  key={item._id}
  property={item}
  isWishlisted={wishlistIds.includes(item._id)}
  onToggleWishlist={handleToggleWishlist}
/>