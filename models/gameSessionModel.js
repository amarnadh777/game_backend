const mongoose = require("mongoose");

const gameSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    highestSpeed: {
      type: Number,
      required: false,
    },

    timeTaken: {
      type: Number,
      required: false,
    },

    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "RESET"],
      default: "IN_PROGRESS",
    },

    vehicle: {
      type: String,
    },

    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);


gameSessionSchema.index({ highestSpeed: -1, timeTaken: 1 });

module.exports = mongoose.model("GameSession", gameSessionSchema);  