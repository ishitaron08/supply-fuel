const FuelPrice = require('../models/FuelPrice');
const asyncWrapper = require('../middleware/asyncWrapper');

// @desc    Get all fuel prices
// @route   GET /api/fuel-prices
exports.getAllPrices = asyncWrapper(async (_req, res) => {
  const prices = await FuelPrice.find().sort({ city: 1 });
  res.status(200).json({
    success: true,
    message: 'Fuel prices retrieved successfully',
    data: prices,
  });
});

// @desc    Get fuel price for a specific city
// @route   GET /api/fuel-prices/:city
exports.getPriceByCity = asyncWrapper(async (req, res) => {
  const { city } = req.params;
  const price = await FuelPrice.findOne({
    city: new RegExp(`^${city}$`, 'i'), // case-insensitive
  });

  if (!price) {
    return res.status(404).json({
      success: false,
      message: `No fuel price found for city: ${city}`,
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: `Fuel price for ${price.city}`,
    data: price,
  });
});

// @desc    Add new city fuel price
// @route   POST /api/fuel-prices
exports.createPrice = asyncWrapper(async (req, res) => {
  const { city, petrol, diesel } = req.body;

  // Check duplicate
  const exists = await FuelPrice.findOne({
    city: new RegExp(`^${city}$`, 'i'),
  });
  if (exists) {
    return res.status(409).json({
      success: false,
      message: `Fuel price for ${city} already exists`,
      data: null,
    });
  }

  const price = await FuelPrice.create({ city, petrol, diesel });

  res.status(201).json({
    success: true,
    message: `Fuel price for ${price.city} added successfully`,
    data: price,
  });
});

// @desc    Update fuel price for a city
// @route   PUT /api/fuel-prices/:city
exports.updatePrice = asyncWrapper(async (req, res) => {
  const { city } = req.params;
  const { petrol, diesel } = req.body;

  const price = await FuelPrice.findOneAndUpdate(
    { city: new RegExp(`^${city}$`, 'i') },
    { petrol, diesel, lastUpdated: Date.now() },
    { new: true, runValidators: true }
  );

  if (!price) {
    return res.status(404).json({
      success: false,
      message: `No fuel price found for city: ${city}`,
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: `Fuel price for ${price.city} updated successfully`,
    data: price,
  });
});

// @desc    Delete city fuel price
// @route   DELETE /api/fuel-prices/:city
exports.deletePrice = asyncWrapper(async (req, res) => {
  const { city } = req.params;
  const price = await FuelPrice.findOneAndDelete({
    city: new RegExp(`^${city}$`, 'i'),
  });

  if (!price) {
    return res.status(404).json({
      success: false,
      message: `No fuel price found for city: ${city}`,
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: `Fuel price for ${price.city} deleted successfully`,
    data: null,
  });
});
