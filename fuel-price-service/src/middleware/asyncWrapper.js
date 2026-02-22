/**
 * Wraps an async route handler so thrown errors are forwarded to Express
 * error-handling middleware automatically.
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncWrapper;
