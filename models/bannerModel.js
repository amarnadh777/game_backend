const mongoose = require('mongoose');

const carImageSchema = new mongoose.Schema({
  carId: {
    type: String,
    required: true
  },
  carName: {
    type: String
  },
  imageUrl: {
    type: String,
    required: true
  }
}, { _id: false });

const bannerSchema = new mongoose.Schema({
  slNo: {
    type: String,
  },
  bannerId: {
    type: String,
  },

  name: {
    type: String, // "Race Track Billboard"
    required: true
  },

  // 🔥 Normal banner (single image)
  imageUrl: {
    type: String,
  },

  // 🔥 Car-specific banners
  isCarSpecific: {
    type: Boolean,
    default: false
  },

  carImages: [carImageSchema], // multiple car images

  resolution: {
    type: String,
  },

  status: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);