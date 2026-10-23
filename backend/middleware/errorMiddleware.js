export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  // Prefer an explicit statusCode set on the error object (our own thrown errors),
  // fall back to whatever res.status() was already called with, then default to 500.
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Resource not found: Invalid ID format';
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Handle Mongoose Duplicate Key Errors (e.g. Unique Email)
  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate field value entered: ${Object.keys(err.keyValue).join(', ')}`;
  }

  // Handle malformed JWTs (distinct from TokenExpiredError, which is handled upstream)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized, invalid token';
  }

  // Log unexpected server errors (5xx) for observability; skip expected 4xx client errors.
  if (statusCode >= 500) {
    console.error('[errorHandler]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
    }),
  });
};