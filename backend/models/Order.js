import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Booking',
      default: null,
    },
    bookingSnapshot: {
      listing: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Listing',
      },
      startDate: { type: Date },
      endDate: { type: Date },
      guests: {
        type: Number,
        default: 1,
        min: 1,
      },
      totalPrice: {
        type: Number,
        default: 0,
        min: 0,
      },
      paymentMethod: { type: String, default: 'paypal' },
      paymentStatus: { type: String, default: 'pending' },
    },
    paypalOrderId: { type: String, required: true, trim: true },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['PENDING', 'APPROVED', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    amount: {
      total: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
        enum: ['USD', 'EUR', 'MAD'],
      },
    },
    payerEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ paypalOrderId: 1 }, { unique: true, sparse: true });
orderSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;