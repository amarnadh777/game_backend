const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  userName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  fullname: {
    type: String,
  },
  // ==========================================
  // NEW FIELDS FOR FORGOT PASSWORD OTP
  // ==========================================
  resetPasswordOtp: {
    type: String,
  },
  resetPasswordOtpExpire: {
    type: Date,
  }
});

module.exports = mongoose.model("Admin", adminSchema);