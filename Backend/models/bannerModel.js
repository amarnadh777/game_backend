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

  slNo: String,

  bannerId: String,

  name: {
    type: String,
    required: true
  },

  clonedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Banner',
    default: null
  },

  imageUrl: String,

  isCarSpecific: {
    type: Boolean,
    default: false
  },

  carImages: [carImageSchema],

  resolution: String,

  status: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });


// 🔥 Only ONE active banner for same bannerId
bannerSchema.index(
  { bannerId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: true
    }
  }
);

module.exports = mongoose.model('Banner', bannerSchema);