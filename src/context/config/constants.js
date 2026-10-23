// ==========================================
// 1. App Metadata
// ==========================================
export const APP_NAME = 'MyDar';

export const DEFAULT_LANGUAGE = 'ar';

export const CURRENCIES = Object.freeze([
  { code: 'MAD', symbol: 'DH', label: 'درهم مغربي (MAD)' },
  { code: 'USD', symbol: '$', label: 'الدولار الأمريكي (USD)' },
  { code: 'EUR', symbol: '€', label: 'اليورو (EUR)' },
]);

// ==========================================
// 2. Listing Categories / Property Types
// IMPORTANT: These values MUST match backend's normalizeCategory()
// in propertyController.js exactly (case-insensitive match on 'id').
// Do NOT add categories here that the backend doesn't accept
// (e.g. 'traditional', 'studio', 'chalet', 'room') - forms using
// these will fail with "Invalid property category".
// ==========================================
export const CATEGORIES = Object.freeze([
  { id: 'Apartment', label: 'شقة', icon: 'Building2' },
  { id: 'Villa', label: 'فيلا', icon: 'Home' },
  { id: 'Riad', label: 'رياض', icon: 'Landmark' },
  { id: 'House', label: 'منزل', icon: 'Trees' },
  { id: 'Cabin', label: 'كوخ', icon: 'Bed' },
]);

// ==========================================
// 3. Property Amenities (المرافق والتجهيزات)
// IMPORTANT: 'id' values must match what AddPropertyPage.jsx /
// EditPropertyPage.jsx send to the backend (Property.amenities is a
// free-form string array, but keep these consistent across the app
// so filtering/display works predictably).
// ==========================================
export const AMENITIES = Object.freeze([
  { id: 'wifi', label: 'واي فاي مجاني', icon: 'Wifi' },
  { id: 'pool', label: 'مسبح', icon: 'Waves' },
  { id: 'ac', label: 'تكييف هواء', icon: 'Wind' },
  { id: 'parking', label: 'موقف سيارات مجاني', icon: 'Car' },
  { id: 'kitchen', label: 'مطبخ مجهز', icon: 'Utensils' },
  { id: 'tv', label: 'تلفزيون ذكي', icon: 'Tv' },
]);

// ==========================================
// 4. Booking & Order Statuses
// ==========================================
export const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
});

export const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  PAYPAL: 'paypal',
});

// ==========================================
// 5. Default Pagination & Filters
// ==========================================
export const DEFAULT_FILTER_PARAMS = Object.freeze({
  category: 'all',
  minPrice: 0,
  maxPrice: 10000,
  guests: 1,
  bedrooms: 0,
  sortBy: 'createdAt',
  order: 'desc',
});

export const ITEMS_PER_PAGE = 12;