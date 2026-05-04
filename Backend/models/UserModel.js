const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  firstName: {
    type: String,
    required: true,
    trim: true
  },

  lastName: {
    type: String,
    required: true,
    trim: true
  },

  // ❌ optional now
  email: {
    type: String,
    lowercase: true,
    sparse: true // ✅ allows multiple null values
  },

  // ❌ not needed for now
  password: {
    type: String,
  },

  country: {
    type: String,
    required: true
  },

  city: {
    type: String,
  },

  phoneNumber: {
    type: String,
  },
phoneCode: {
  type: String, // "+91"
},

  // ✅ for admin panel
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  status: {
    type: Boolean,
    default: true
  },

  isEmailVerified: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});


// 🔥 IMPORTANT: prevent duplicate users
userSchema.index(
  { firstName: 1, lastName: 1, country: 1 },
  { unique: true }
);

module.exports = mongoose.model('User', userSchema);