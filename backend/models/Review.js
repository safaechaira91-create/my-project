import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const ReviewSchema = new Schema(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    userImage: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    hostReply: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// منع المستخدم من ترك أكثر من تقييم واحد لنفس العقار
ReviewSchema.index({ listingId: 1, userId: 1 }, { unique: true });

// تسريع عملية جلب أحدث التقييمات لعقار معين
ReviewSchema.index({ listingId: 1, createdAt: -1 });

const Review = models.Review || model('Review', ReviewSchema);

export default Review;