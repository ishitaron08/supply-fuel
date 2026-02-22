const express = require('express');
const router = express.Router();
const {
  getAllPrices,
  getPriceByCity,
  createPrice,
  updatePrice,
  deletePrice,
} = require('../controllers/fuelPriceController');
const validate = require('../middleware/validate');

router.route('/')
  .get(getAllPrices)
  .post(validate, createPrice);

router.route('/:city')
  .get(getPriceByCity)
  .put(validate, updatePrice)
  .delete(deletePrice);

module.exports = router;
