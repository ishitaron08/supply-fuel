const mongoose = require('mongoose');

const fuelPriceSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, 'City name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    petrol: {
      type: Number,
      required: [true, 'Petrol price is required'],
      min: [0, 'Petrol price must be a positive number'],
    },
    diesel: {
      type: Number,
      required: [true, 'Diesel price is required'],
      min: [0, 'Diesel price must be a positive number'],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Normalise city to Title Case before save
fuelPriceSchema.pre('save', function (next) {
  if (this.isModified('city')) {
    this.city =
      this.city.charAt(0).toUpperCase() + this.city.slice(1).toLowerCase();
  }
  next();
});

module.exports = mongoose.model('FuelPrice', fuelPriceSchema);
