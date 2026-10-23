import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import { buildImagePayload, deleteLocalImage } from '../utils/localUpload.js';

const ensureHostRole = (user) => {
  if (!user || (user.role !== 'host' && user.role !== 'admin')) {
    const error = new Error('Only hosts can manage properties');
    error.statusCode = 403;
    throw error;
  }
};

const normalizeCategory = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  const categoryMap = {
    apartment: 'Apartment',
    house: 'House',
    villa: 'Villa',
    riad: 'Riad',
    cabin: 'Cabin',
  };

  return categoryMap[normalized] || null;
};

const parseFiniteNumber = (value, fieldName, { min = null } = {}) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    const error = new Error(`${fieldName} must be a valid number`);
    error.statusCode = 400;
    throw error;
  }

  if (min !== null && parsed < min) {
    const error = new Error(`${fieldName} must be greater than or equal to ${min}`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
};

const parsePositiveInteger = (value, fieldName, fallback = 1) => {
  if (value === undefined || value === null || value === '') return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    const error = new Error(`${fieldName} must be a positive integer`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
};

const parseBoolean = (value, fieldName) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }

  const error = new Error(`${fieldName} must be a boolean`);
  error.statusCode = 400;
  throw error;
};

const normalizeCoordinates = (coordinates) => {
  if (!coordinates) {
    return { lat: null, lng: null };
  }

  if (Array.isArray(coordinates)) {
    const [lat, lng] = coordinates;
    return {
      lat: Number.isFinite(Number(lat)) ? Number(lat) : null,
      lng: Number.isFinite(Number(lng)) ? Number(lng) : null,
    };
  }

  const lat = coordinates.lat !== undefined && coordinates.lat !== null ? Number(coordinates.lat) : null;
  const lng = coordinates.lng !== undefined && coordinates.lng !== null ? Number(coordinates.lng) : null;

  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
};

const normalizeLocation = (location) => {
  if (typeof location === 'string') {
    const city = location.trim();
    return city ? { city, address: '', coordinates: { lat: null, lng: null } } : null;
  }

  if (!location || typeof location !== 'object') {
    return null;
  }

  const city = String(location.city || '').trim();
  if (!city) return null;

  return {
    city,
    address: String(location.address || '').trim(),
    coordinates: normalizeCoordinates(location.coordinates),
  };
};

const getOptionalUserFromRequest = async (req) => {
  const authHeader = req.headers.authorization || '';
  const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : '';
  const token = bearerToken || req.cookies?.accessToken;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    return await User.findById(decoded.id).select('_id role');
  } catch {
    return null;
  }
};

export const getAllListings = asyncHandler(async (req, res) => {
  const {
    city,
    minPrice,
    maxPrice,
    guests,
    amenities,
    search,
    sort = 'newest',
  } = req.query;

  const query = { availability: true, status: 'approved' };

  if (city && typeof city === 'string') {
    const safeCity = city
      .trim()
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query['location.city'] = { $regex: safeCity, $options: 'i' };
  }
  
  const numGuests = Number(guests);
  if (guests && !isNaN(numGuests)) {
    query.guests = { $gte: numGuests };
  }

  if (search && typeof search === 'string') {
    const safeSearch = search
      .trim()
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = { $regex: safeSearch, $options: 'i' };
    
    if (query['location.city']) {
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    } else {
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'location.city': searchRegex }
      ];
    }
  }

  const min = Number(minPrice);
  const max = Number(maxPrice);
  if ((minPrice && min < 0) || (maxPrice && max < 0)) {
    res.status(400);
    throw new Error('Invalid price range');
  }

  if ((minPrice && !isNaN(min)) || (maxPrice && !isNaN(max))) {
    query.price = {};
    if (!isNaN(min)) query.price.$gte = min;
    if (!isNaN(max)) query.price.$lte = max;
  }

  if (amenities) {
    const amenitiesList = String(amenities)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (amenitiesList.length) query.amenities = { $all: amenitiesList };
  }

  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1 },
  };

  const listings = await Property.find(query)
    .populate('host', 'name email image')
    .sort(sortMap[sort] || sortMap.newest)
    .lean();

  res.json({ listings, total: listings.length });
});

export const getListingById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property id');
  }

  const listing = await Property.findById(req.params.id).populate('host', 'name email image phone');

  if (!listing) {
    res.status(404);
    throw new Error('Property not found');
  }

  if (listing.status !== 'approved') {
    const currentUser = await getOptionalUserFromRequest(req);
    const hostId = listing.host?._id || listing.host;
    const isOwnerOrAdmin = currentUser
      && (currentUser.role === 'admin' || String(hostId) === String(currentUser._id));

    if (!isOwnerOrAdmin) {
      res.status(404);
      throw new Error('Property not found');
    }
  }

  res.json(listing);
});

export const getMyListings = asyncHandler(async (req, res) => {
  ensureHostRole(req.user);

  const listings = await Property.find({ host: req.user._id }).sort({ createdAt: -1 });
  res.json({ listings, total: listings.length });
});

export const createListing = asyncHandler(async (req, res) => {
  ensureHostRole(req.user);

  const {
    title,
    description,
    price,
    category,
    guests,
    bedrooms,
    bathrooms,
    amenities = [],
    availability = true,
    location,
    images,
  } = req.body;

  if (String(title).trim().length > 150) {
    res.status(400);
    throw new Error('Title too long');
  }

  if (String(description).trim().length > 5000) {
    res.status(400);
    throw new Error('Description too long');
  }

  const normalizedLocation = normalizeLocation(location);
  const normalizedCategory = category !== undefined ? normalizeCategory(category) : null;
  const normalizedImages = Array.isArray(images)
    ? images
      .map((image) => (typeof image === 'string' ? image : image?.url || image?.secure_url || image?.path || ''))
      .map((image) => String(image).trim())
      .filter(Boolean)
    : [];

  if (normalizedImages.length > 10) {
    res.status(400);
    throw new Error('Maximum 10 images allowed');
  }

  if (!title || !description || price === undefined || price === null || price === '' || !normalizedLocation?.city || !normalizedImages.length) {
    res.status(400);
    throw new Error('Missing required property fields');
  }

  if (category !== undefined && !normalizedCategory) {
    res.status(400);
    throw new Error('Invalid property category');
  }

  const listing = await Property.create({
    host: req.user._id,
    title: String(title).trim(),
    description: String(description).trim(),
    price: parseFiniteNumber(price, 'Price', { min: 1 }),
    category: normalizedCategory || undefined,
    guests: parsePositiveInteger(guests, 'Guests'),
    bedrooms: parsePositiveInteger(bedrooms, 'Bedrooms'),
    bathrooms: parsePositiveInteger(bathrooms, 'Bathrooms'),
    amenities: Array.isArray(amenities) ? amenities.filter(Boolean) : String(amenities || '').split(',').map((item) => item.trim()).filter(Boolean),
    availability: availability === undefined ? true : parseBoolean(availability, 'Availability'),
    location: normalizedLocation,
    images: normalizedImages,
  });

  res.status(201).json(listing);
});

export const updateListing = asyncHandler(async (req, res) => {
  ensureHostRole(req.user);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property id');
  }

  const listing = await Property.findById(req.params.id);

  if (!listing) {
    res.status(404);
    throw new Error('Property not found');
  }

  if (listing.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not allowed to edit this property');
  }

  if (req.body.title !== undefined) {
    const nextTitle = String(req.body.title).trim();
    if (!nextTitle) {
      res.status(400);
      throw new Error('Title is required');
    }
    if (nextTitle.length > 150) {
      res.status(400);
      throw new Error('Title too long');
    }
    listing.title = nextTitle;
  }

  if (req.body.description !== undefined) {
    const nextDescription = String(req.body.description).trim();
    if (!nextDescription) {
      res.status(400);
      throw new Error('Description is required');
    }
    if (nextDescription.length > 5000) {
      res.status(400);
      throw new Error('Description too long');
    }
    listing.description = nextDescription;
  }

  if (req.body.price !== undefined) {
    listing.price = parseFiniteNumber(req.body.price, 'Price', { min: 1 });
  }

  if (req.body.category !== undefined) {
    const nextCategory = normalizeCategory(req.body.category);
    if (!nextCategory) {
      res.status(400);
      throw new Error('Invalid property category');
    }
    listing.category = nextCategory;
  }

  if (req.body.guests !== undefined) {
    listing.guests = parsePositiveInteger(req.body.guests, 'Guests', listing.guests);
  }

  if (req.body.bedrooms !== undefined) {
    listing.bedrooms = parsePositiveInteger(req.body.bedrooms, 'Bedrooms', listing.bedrooms);
  }

  if (req.body.bathrooms !== undefined) {
    listing.bathrooms = parsePositiveInteger(req.body.bathrooms, 'Bathrooms', listing.bathrooms);
  }

  if (req.body.amenities !== undefined) {
    listing.amenities = Array.isArray(req.body.amenities)
      ? req.body.amenities.filter(Boolean)
      : String(req.body.amenities || '').split(',').map((item) => item.trim()).filter(Boolean);
  }

  if (req.body.availability !== undefined) {
    listing.availability = parseBoolean(req.body.availability, 'Availability');
  }

  if (req.body.location) {
    const currentLocation = listing.location?.toObject ? listing.location.toObject() : (listing.location || {});
    const nextLocation = normalizeLocation(req.body.location);
    if (!nextLocation?.city) {
      res.status(400);
      throw new Error('Location city is required');
    }
    listing.location = {
      ...currentLocation,
      ...nextLocation,
      coordinates: {
        ...(currentLocation.coordinates || {}),
        ...(nextLocation.coordinates || {}),
      },
    };
  }

  if (req.body.images !== undefined) {
    const nextImages = Array.isArray(req.body.images)
      ? req.body.images
      : String(req.body.images || '').split(',');

    if (nextImages.length > 10) {
      res.status(400);
      throw new Error('Maximum 10 images allowed');
    }

    listing.images = nextImages
      .map((image) => (typeof image === 'string' ? image : image?.url || image?.secure_url || image?.path || ''))
      .map((image) => String(image).trim())
      .filter(Boolean);

    if (!listing.images.length) {
      res.status(400);
      throw new Error('At least one image is required');
    }
  }

  // Editing an approved listing sends it back to review to prevent bait-and-switch changes.
  if (listing.status === 'approved') {
    listing.status = 'pending';
    listing.rejectionReason = '';
  }

  const updatedListing = await listing.save();
  res.json(updatedListing);
});

export const deleteListing = asyncHandler(async (req, res) => {
  ensureHostRole(req.user);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property id');
  }

  const listing = await Property.findById(req.params.id);

  if (!listing) {
    res.status(404);
    throw new Error('Property not found');
  }

  if (listing.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not allowed to delete this property');
  }

  const hasBookings = await Booking.exists({ listing: listing._id });
  if (hasBookings) {
    res.status(409);
    throw new Error('Cannot delete a property with existing bookings');
  }

  for (const imageUrl of listing.images || []) {
    try {
      await deleteLocalImage(imageUrl);
    } catch {
      // Ignore local file cleanup failure, property deletion should continue.
    }
  }

  await listing.deleteOne();
  res.json({ message: 'Property deleted successfully' });
});

export const uploadPropertyImages = asyncHandler(async (req, res) => {
  ensureHostRole(req.user);

  if (!req.files || !req.files.length) {
    res.status(400);
    throw new Error('Please upload at least one image');
  }

  if (req.files.length > 10) {
    res.status(400);
    throw new Error('Maximum 10 images allowed');
  }

  const uploadedImages = [];
  for (const file of req.files) {
    uploadedImages.push(buildImagePayload(req, file));
  }

  res.status(201).json(uploadedImages);
});