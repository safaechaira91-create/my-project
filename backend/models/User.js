import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const EMAIL_MATCH_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_MATCH_REGEX, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'guest', 'host', 'admin'],
      default: 'user',
    },
    tokenVersion: { type: Number, default: 0 },
    refreshToken: { type: String, default: null, select: false },
    isBanned: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: '', select: false },
    emailVerificationExpires: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: '', select: false },
    passwordResetExpires: { type: Date, default: null },
    image: {
      type: String,
      default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    },
    bio: { type: String, maxlength: 500, trim: true },
    phone: { type: String, trim: true, maxlength: 20 },
    wishlist: [
      new mongoose.Schema(
        {
          listingId: { type: String, required: true },
          source: { type: String, enum: ['listing', 'property'], required: true },
          title: { type: String, required: true },
          price: { type: Number, default: 0, min: 0 },
          rating: { type: Number, default: 0, min: 0, max: 5 },
          image: { type: String, default: '' },
          city: { type: String, default: 'Morocco' },
        },
        { _id: false }
      ),
    ],
  },
  { timestamps: true }
);

// NOTE: There used to be a separate `uid` field mirroring `_id` as a string
// (a leftover from an earlier Firebase-based auth design). It has been removed
// since `_id` already serves this purpose. The frontend still reads `user.uid`
// in some places as a fallback (`user?._id || user?.uid`) - those fallbacks are
// harmless now (uid will just be undefined) but can be cleaned up over time.

userSchema.virtual('uid').get(function () {
  return this._id.toString();
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.index({ role: 1 });
userSchema.index({ isBanned: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;