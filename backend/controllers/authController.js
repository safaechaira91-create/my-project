import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_ERROR_MESSAGE =
  'Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number.';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const createRawToken = () => crypto.randomBytes(32).toString('hex');

const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('accessToken', accessToken, {
    ...authCookieOptions(),
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    ...authCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res) => {
  const expiredCookie = {
    ...authCookieOptions(),
    expires: new Date(0),
  };

  res.cookie('refreshToken', '', expiredCookie);
  res.cookie('accessToken', '', expiredCookie);
};

export const generateAccessToken = (id, tokenVersion = 0) => {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('Server configuration error: JWT_ACCESS_SECRET is missing');
  }

  return jwt.sign({ id, tv: tokenVersion }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (id, tokenVersion = 0) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('Server configuration error: JWT_REFRESH_SECRET is missing');
  }

  return jwt.sign({ id, tv: tokenVersion }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const userPayload = (user) => ({
  uid: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  image: user.image,
  phone: user.phone || '',
  bio: user.bio || '',
  isEmailVerified: Boolean(user.isEmailVerified),
});

const buildAuthResponse = (user) => ({
  user: userPayload(user),
});

const issueSession = (res, user) => {
  const version = user.tokenVersion || 0;
  const accessToken = generateAccessToken(user._id, version);
  const refreshToken = generateRefreshToken(user._id, version);
  setAuthCookies(res, { accessToken, refreshToken });
  return { accessToken, refreshToken };
};

const sendVerificationEmail = async (user, rawToken) => {
  await sendEmail({
    to: user.email,
    subject: 'Verify your MyDar account',
    text: `Verify your email within 24 hours: ${getFrontendUrl()}/verify-email/${rawToken}`,
    html: `
      <p>Welcome to MyDar, ${user.name}.</p>
      <p>Please verify your email within 24 hours:</p>
      <p><a href="${getFrontendUrl()}/verify-email/${rawToken}">Verify email</a></p>
    `,
  });
};

const sendPasswordResetEmail = async (user, rawToken) => {
  await sendEmail({
    to: user.email,
    subject: 'Reset your MyDar password',
    text: `Reset your password here: ${getFrontendUrl()}/reset-password/${rawToken}`,
    html: `
      <p>Reset your MyDar password.</p>
      <p><a href="${getFrontendUrl()}/reset-password/${rawToken}">Reset password</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  });
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !password || typeof password !== 'string') {
    res.status(400);
    throw new Error('The form must contain name, email, and password');
  }

  const trimmedName = name.trim();
  const normalizedEmail = email.toLowerCase().trim();

  if (!normalizedEmail.includes('@') || !PASSWORD_REGEX.test(password)) {
    res.status(400);
    throw new Error(PASSWORD_ERROR_MESSAGE);
  }

  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    res.status(400);
    throw new Error('Unable to create account');
  }

  const user = await User.create({
    name: trimmedName,
    email: normalizedEmail,
    password,
    role: 'user',
    isEmailVerified: false,
  });

  const verificationToken = createRawToken();
  user.emailVerificationTokenHash = hashToken(verificationToken);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  issueSession(res, user);

  // Best-effort email sending: don't fail the whole registration if SMTP is down.
  // The user account and session are already valid at this point.
  try {
    await sendVerificationEmail(user, verificationToken);
  } catch (emailError) {
    console.error('[registerUser] Failed to send verification email:', emailError.message);
  }

  res.status(201).json({
    ...buildAuthResponse(user),
    emailVerificationRequired: true,
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({
    email: normalizedEmail,
  }).select('+password +refreshToken');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.isBanned) {
    res.status(403);
    throw new Error('Your account is suspended. Please contact support.');
  }

  issueSession(res, user);

  res.json({
    ...buildAuthResponse(user),
    emailVerificationRequired: !user.isEmailVerified,
  });
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.isBanned || (user.tokenVersion || 0) !== Number(decoded.tv || 0)) {
      return res.status(403).json({ message: 'Session expired' });
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    issueSession(res, user);
    res.json({ success: true });
  } catch {
    res.status(403).json({ message: 'Session expired' });
  }
});

export const getUserProfile = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Unauthorized, no user data');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(userPayload(user));
});

export const logoutUser = asyncHandler(async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);
      if (user && (user.tokenVersion || 0) === Number(decoded.tv || 0)) {
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
      }
    }
  } catch {
    // Best effort revocation; cookies are cleared below regardless.
  }

  clearAuthCookies(res);
  res.status(200).json({ message: 'Logged out' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification token');
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = '';
  user.emailVerificationExpires = null;
  await user.save();

  res.json({ message: 'Email verified successfully' });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: 'If the email exists, a verification link will be sent' });
  }

  if (user.isEmailVerified) {
    return res.json({ message: 'Email already verified' });
  }

  const verificationToken = createRawToken();
  user.emailVerificationTokenHash = hashToken(verificationToken);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  try {
    await sendVerificationEmail(user, verificationToken);
  } catch (emailError) {
    console.error('[resendVerificationEmail] Failed to send email:', emailError.message);
  }

  res.json({ message: 'If the email exists, a verification link will be sent' });
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: 'If the email exists, a reset link will be sent' });
  }

  const resetToken = createRawToken();
  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  try {
    await sendPasswordResetEmail(user, resetToken);
  } catch (emailError) {
    console.error('[requestPasswordReset] Failed to send email:', emailError.message);
  }

  res.json({ message: 'If the email exists, a reset link will be sent' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
    res.status(400);
    throw new Error(PASSWORD_ERROR_MESSAGE);
  }

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = password;
  user.passwordResetTokenHash = '';
  user.passwordResetExpires = null;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  issueSession(res, user);
  res.json({ message: 'Password reset successfully' });
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const wantsEmailChange = req.body.email && typeof req.body.email === 'string';
  const wantsPasswordChange = req.body.password && typeof req.body.password === 'string';

  // Require current password confirmation for sensitive changes (email/password).
  if (wantsEmailChange || wantsPasswordChange) {
    const { currentPassword } = req.body;
    if (!currentPassword || typeof currentPassword !== 'string') {
      res.status(400);
      throw new Error('Current password is required to change email or password');
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }
  }

  if (req.body.name && typeof req.body.name === 'string') user.name = req.body.name.trim();

  let emailChanged = false;
  if (wantsEmailChange) {
    const newEmail = req.body.email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(newEmail)) {
      res.status(400);
      throw new Error('Invalid email format');
    }

    if (newEmail !== user.email) {
      const existingUser = await User.findOne({
        email: newEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        res.status(400);
        throw new Error('Email is already in use');
      }

      user.email = newEmail;
      emailChanged = true;
      user.isEmailVerified = false;
    }
  }

  if (req.body.phone !== undefined) user.phone = String(req.body.phone);
  if (req.body.bio !== undefined) user.bio = String(req.body.bio);
  if (req.body.image !== undefined) user.image = String(req.body.image);

  let passwordChanged = false;
  if (wantsPasswordChange) {
    if (!PASSWORD_REGEX.test(req.body.password)) {
      res.status(400);
      throw new Error(PASSWORD_ERROR_MESSAGE);
    }

    user.password = req.body.password;
    passwordChanged = true;
  }

  if (passwordChanged) {
    user.tokenVersion = (user.tokenVersion || 0) + 1;
  }

  const verificationToken = emailChanged ? createRawToken() : null;
  if (verificationToken) {
    user.emailVerificationTokenHash = hashToken(verificationToken);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  const updatedUser = await user.save();
  issueSession(res, updatedUser);

  if (verificationToken) {
    try {
      await sendVerificationEmail(updatedUser, verificationToken);
    } catch (emailError) {
      console.error('[updateUserProfile] Failed to send verification email:', emailError.message);
    }
  }

  res.json({
    ...buildAuthResponse(updatedUser),
    emailVerificationRequired: !updatedUser.isEmailVerified,
  });
});