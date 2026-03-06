const User = require("../models/UserModel");
const GameSession = require("../models/gameSessionModel");

exports.startGame = async (req, res) => {
  try {
    const  userId  = req.user._id;
    // console.log("Starting game for user:", userId);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check user exists
    const userExist = await User.findById(userId);
    if (!userExist) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already IN_PROGRESS session exists
    const gameSessionExist = await GameSession.findOne({
      userId,
      status: "IN_PROGRESS",
    });

    if (gameSessionExist) {
      gameSessionExist.status = "RESET";
      await gameSessionExist.save();
    }

    // Create new session
    const newSession = await GameSession.create({
      userId,
      status: "IN_PROGRESS",
    });

    return res.status(201).json({
      success: true,
      message: "Game session started",
      gameSessionId: newSession._id,
    });
  } catch (error) {

    console.log("Error starting game session:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.finishGame = async (req, res) => {
  try {
    const { gameSessionId, highestSpeed, timeTaken } = req.body;
    if (!gameSessionId || !highestSpeed || !timeTaken) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }
    const session = await GameSession.findById(gameSessionId);

    if (!session) {
      return res.status(404).json({ message: "Game session not found" });
    }

    // 🔎 Ensure session is active
    if (session.status !== "IN_PROGRESS") {
      return res.status(400).json({
        message: "Game already completed or reset",
      });
    }

    // 🎯 Save final result
    session.highestSpeed = highestSpeed;
    session.timeTaken = timeTaken;
    session.status = "COMPLETED";
    session.completedAt = new Date();

    await session.save();
    return res.status(200).json({
      success: true,
      message: "Game finished successfully",
      session,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: "Game finished successfully",
      session,
    });
  }
};

exports.restGame = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const userExist = await User.findById(userId);
    if (!userExist) {
      return res.status(404).json({ message: "User not found" });
    }
    const result = await GameSession.updateMany(
      { userId, status: "IN_PROGRESS" },
      { status: "RESET" },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "No active game session found to reset" });
    }
    return res.status(200).json({
      success: true,
      message: "Game reset successfully",
      sessionsReset: result.modifiedCount,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: "Game reset successfully",
      sessionsReset: result.modifiedCount,
    });
  }
};

exports.getGameLeaderBord  = async (req, res) => {
    try {
        const sessions = await GameSession.find({ status: "COMPLETED" })
          .sort({ highestSpeed: -1, timeTaken: 1 }).populate("userId", "firstName lastName email");

          const leaderboard = sessions.map((session,index) =>{
            return{
                rank: index + 1,
                user: session.userId._id,
                firstName: session.userId.firstName,
                lastName: session.userId.lastName,
                email: session.userId.email,

                highestSpeed: session.highestSpeed,
                timeTaken: session.timeTaken,
                completedAt: session.completedAt
            }
          })
res.status(200).json({
      success: true,
      leaderboard,
    });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
}