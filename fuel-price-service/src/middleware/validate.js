/**
 * Request body validation middleware for fuel price payloads.
 * - city  : required string  (on POST)
 * - petrol: required positive number
 * - diesel: required positive number
 */
const validate = (req, res, next) => {
  const { city, petrol, diesel } = req.body;
  const errors = [];

  // city is required only on POST (create)
  if (req.method === 'POST') {
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      errors.push('city must be a non-empty string');
    }
  }

  if (petrol === undefined && diesel === undefined) {
    errors.push('At least one of petrol or diesel price is required');
  }

  if (petrol !== undefined) {
    if (typeof petrol !== 'number' || petrol < 0) {
      errors.push('petrol must be a positive number');
    }
  }

  if (diesel !== undefined) {
    if (typeof diesel !== 'number' || diesel < 0) {
      errors.push('diesel must be a positive number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: errors,
    });
  }

  next();
};

module.exports = validate;
