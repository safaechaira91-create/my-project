import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const NotificationSchema = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['booking', 'system', 'message', 'host_upgrade', 'payment'],
      default: 'booking',
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({
  recipientId: 1,
  read: 1,
  createdAt: -1,
});

const Notification = models.Notification || model('Notification', NotificationSchema);

export default Notification;