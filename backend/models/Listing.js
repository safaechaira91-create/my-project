import mongoose from 'mongoose';

const listingSchema = mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    price: {
      type: Number,
      required: true,
      min: 1,
    },
    location: {
      address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: [
        (v) => Array.isArray(v) && v.length > 0,
        'At least one image is required',
      ],
    },
    category: {
      type: String,
      required: true,
      enum: ['Apartment', 'House', 'Villa', 'Riad', 'Cabin'],
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    amenities: [{ type: String }],
    availability: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

listingSchema.index({ title: 'text', description: 'text' });
listingSchema.index({ host: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ category: 1 });
listingSchema.index({ 'location.city': 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ availability: 1 });

const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);

export default Listing;