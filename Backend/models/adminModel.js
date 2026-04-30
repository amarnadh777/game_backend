const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema({
  userName: {
    type: String,trim: true,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
});

module.exports = mongoose.model("Admin", adminSchema);
