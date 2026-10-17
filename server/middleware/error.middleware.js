const AppError = require('../utils/appError');

const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = 'Validation error';
    const errors = Object.values(err.errors).map((e) => e.message);
    error = new AppError(message, 400, errors);
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered`;
    error = new AppError(message, 409);
  }

  // Handle Invalid JWT
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Authentication failed', 401);
  }

  // Handle Expired JWT
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token has expired. Please log in again', 401);
  }

  const statusCode = error.statusCode || 500;
  const responsePayload = {
    success: false,
    message: error.message || 'Internal server error',
  };

  if (error.errors && error.errors.length > 0) {
    responsePayload.errors = error.errors;
  }

  if (err.reasons && err.reasons.length > 0) {
    responsePayload.reasons = err.reasons;
  }

  res.status(statusCode).json(responsePayload);
};

module.exports = globalErrorHandler;
