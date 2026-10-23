import mongoose from 'mongoose';

const bookingSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Property',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    guests: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 50,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'paypal'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paypalOrderId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ listing: 1, startDate: 1, endDate: 1, status: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index(
  { paypalOrderId: 1 },
  { unique: true, sparse: true }
);

// Defense-in-depth: even if a booking is created/modified outside the normal
// controller flow (e.g. a script, migration, or future code path), invalid
// date ranges are rejected at the model level too.
bookingSchema.pre('save', function (next) {
  if (isNaN(this.startDate.getTime()) || isNaN(this.endDate.getTime())) {
    return next(new Error('Invalid dates provided'));
  }

  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }

  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;