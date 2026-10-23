import mongoose from 'mongoose';

const EMAIL_MATCH_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const supportRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_MATCH_REGEX, 'Invalid email format'],
    },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    language: { type: String, default: 'ar' },
    type: { type: String, enum: ['support', 'host-upgrade'], default: 'support' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'resolved'], default: 'pending' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminReply: { type: String, default: '', trim: true },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

supportRequestSchema.index({ status: 1, createdAt: -1 });
supportRequestSchema.index({ type: 1 });
supportRequestSchema.index({ userId: 1 });

const SupportRequest =
  mongoose.models.SupportRequest ||
  mongoose.model('SupportRequest', supportRequestSchema);

export default SupportRequest;