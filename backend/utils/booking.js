import Booking from '../models/Booking.js';

const DAY_MS = 1000 * 60 * 60 * 24;

export const parseBookingDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getPriceNumber = (price) => {
  const numeric =
    typeof price === 'string'
      ? Number(price.replace(/[^0-9.]/g, ''))
      : Number(price || 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const normalizeGuestCount = (value, maxGuests) => {
  const guests = Number(value);
  if (!Number.isInteger(guests) || guests < 1) return null;
  if (Number.isInteger(Number(maxGuests)) && guests > Number(maxGuests)) return null;
  return guests;
};

export const calculateNights = (startDate, endDate) => {
  const start = parseBookingDate(startDate);
  const end = parseBookingDate(endDate);

  if (!start || !end || end <= start) return 0;

  // إعادة ضبط الساعات والدقائق لحساب الأيام بدقة بديلة للتوقيت المحلي
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  return Math.max(1, Math.round((utcEnd - utcStart) / DAY_MS));
};

export const buildOverlapQuery = (listingId, startDate, endDate, excludedBookingId = null) => {
  const query = {
    listing: listingId,
    status: { $nin: ['cancelled', 'rejected'] },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };

  if (excludedBookingId) {
    query._id = { $ne: excludedBookingId };
  }

  return query;
};

export const ensureBookingCanBeCreated = (listing) => {
  if (!listing) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }

  if (listing.availability === false || (listing.status && listing.status !== 'approved')) {
    const error = new Error('This property is not available for booking');
    error.statusCode = 400;
    throw error;
  }
};

export const findOverlappingBooking = (listingId, startDate, endDate, session = null, excludedBookingId = null) => {
  const query = buildOverlapQuery(listingId, startDate, endDate, excludedBookingId);
  let finder = Booking.findOne(query);
  if (session) finder = finder.session(session);
  return finder;
};