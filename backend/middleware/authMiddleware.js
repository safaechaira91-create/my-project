﻿import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  const bearerToken =
    typeof authHeader === 'string' && /^Bearer\s+/i.test(authHeader)
      ? authHeader.replace(/^Bearer\s+/i, '').trim()
      : '';
  const token = bearerToken || req.cookies?.accessToken;

  if (!token) {
    res.status(401);
    throw new Error('Unauthorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    if (user.isBanned) {
      const error = new Error('Account suspended');
      error.statusCode = 403;
      throw error;
    }

    if ((user.tokenVersion || 0) !== Number(decoded.tv || 0)) {
      const error = new Error('Unauthorized, token revoked');
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    // Errors we threw ourselves above already carry the intended statusCode
    // (401/403). JWT library errors (expired/invalid/malformed) don't, so we
    // map those explicitly instead of relying on res.statusCode side effects.
    if (error.statusCode) {
      res.status(error.statusCode);
      throw new Error(error.message);
    }

    if (error?.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error('Unauthorized, token expired');
    }

    console.warn('[authMiddleware] Token verification failed:', error.message);
    res.status(401);
    throw new Error('Unauthorized, invalid token');
  }
});

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Access denied. Admin only.');
  }
  if (req.user.isBanned) {
    res.status(403);
    throw new Error('Account suspended');
  }
  next();
};

export const hostOrAdminOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 'host' && req.user.role !== 'admin')) {
    res.status(403);
    throw new Error('Access denied. Hosts or admins only.');
  }
  if (req.user.isBanned) {
    res.status(403);
    throw new Error('Account suspended');
  }
  next();
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error('Access denied. Insufficient permissions.');
  }
  if (req.user.isBanned) {
    res.status(403);
    throw new Error('Account suspended');
  }
  next();
};