import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 1 },
    location: {
      address: { type: String, default: '', trim: true },
      city: { type: String, required: true, trim: true },
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
      enum: ['Apartment', 'House', 'Villa', 'Riad', 'Cabin'],
      default: 'Apartment',
    },
    guests: { type: Number, required: true, min: 1, default: 1 },
    bedrooms: { type: Number, required: true, min: 1, default: 1 },
    bathrooms: { type: Number, required: true, min: 1, default: 1 },
    amenities: [{ type: String }],
    availability: { type: Boolean, default: true },
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
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

propertySchema.index({ title: 'text', description: 'text', 'location.city': 'text' });
propertySchema.index({ host: 1 });
propertySchema.index({ category: 1 });
propertySchema.index({ 'location.city': 1 });
propertySchema.index({ price: 1 });

// Compound index matching the most common public query shape:
// { availability: true, status: 'approved' } combined with sort by createdAt.
propertySchema.index({ status: 1, availability: 1, createdAt: -1 });

const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);

export default Property;