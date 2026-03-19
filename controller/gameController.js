const User = require("../models/UserModel");
const GameSession = require("../models/gameSessionModel");
const ExcelJS = require("exceljs");

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
    const { gameSessionId, highestSpeed, timeTaken, vehicle } = req.body;

    if (!gameSessionId || !highestSpeed || !timeTaken) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const session = await GameSession.findById(gameSessionId);

    if (!session) {
      return res.status(404).json({
        message: "Game session not found",
      });
    }

    if (session.status !== "IN_PROGRESS") {
      return res.status(400).json({
        message: "Game already completed or reset",
      });
    }

    // 🎯 Save data
    session.highestSpeed = highestSpeed;
    session.timeTaken = timeTaken;
    session.vehicle = vehicle; // 🔥 ADD THIS
    session.status = "COMPLETED";
    session.completedAt = new Date();

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Game finished successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({   // ❗ fix your bug here
      success: false,
      message: error.message,
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

// Ensure you import the User model at the top of the file
// const User = require('../models/user'); // Adjust path to your actual model
// const GameSession = require('../models/gameSession');

exports.getGameLeaderBord = async (req, res) => {
  try {
    let { page = 1, limit = 10, filterBy, searchQuery } = req.query;

    // Prevent crashes for invalid page/limit inputs
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, parseInt(limit) || 10);

    const skip = (page - 1) * limit;

    const filter = { status: "COMPLETED" };

    // The Search/Filtering Logic
    if (filterBy && searchQuery) {
      let userQuery = {};
      
      // Use $regex for partial, case-insensitive matching
      if (filterBy === "email") {
        userQuery.email = { $regex: searchQuery, $options: "i" };
      } else if (filterBy === "country") {
        userQuery.country = { $regex: searchQuery, $options: "i" };
      } else if (filterBy === "name") {
        userQuery.$or = [
          { firstName: { $regex: searchQuery, $options: "i" } },
          { lastName: { $regex: searchQuery, $options: "i" } }
        ];
      }

      // Find matching users first
      const matchingUsers = await User.find(userQuery).select("_id");
      const userIds = matchingUsers.map(user => user._id);

      // Apply those user IDs to the GameSession filter
      filter.userId = { $in: userIds };
    }

    // Get paginated and filtered data
    const sessions = await GameSession.find(filter)
      .sort({ highestSpeed: -1, timeTaken: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate(
        "userId",
        "firstName lastName email country status phoneNumber"
      );

    // Total count for the exact same filter (essential for pagination math)
    const total = await GameSession.countDocuments(filter);

    const leaderboard = sessions.map((session, index) => ({
      rank: skip + index + 1, 
      
      // Optional Chaining to prevent "Cannot read properties of null" errors
      user: session.userId?._id || "Deleted User",
      firstName: session.userId?.firstName || "Unknown",
      lastName: session.userId?.lastName || "",
      email: session.userId?.email || "N/A",
      highestSpeed: session.highestSpeed,
      timeTaken: session.timeTaken,
      completedAt: session.completedAt,
      country: session.userId?.country || "N/A",
      status: session.userId?.status || false,
      phoneNumber: session.userId?.phoneNumber || "N/A",
    }));

    res.status(200).json({
      success: true,
      leaderboard,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1, // Fixes NaN if total is 0
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.dowloadLeaderBoard = async(req,res) =>{

  try {
 const { startDate, endDate } = req.query;


 if(!startDate || !endDate){
    return res.status(400).json({message:"Please provide start and end date"})
  }
 let filter = { status: "COMPLETED" };
if(startDate && endDate){
  filter.completedAt = {
    $gte: new Date(startDate),
    $lte: new Date(endDate),
  }
}



const formatTimeTaken = (rawSeconds) => {
  if (rawSeconds === null || rawSeconds === undefined) return 'N/A';

  // Make sure we are working with a clean number
  const totalSeconds = parseInt(rawSeconds, 10);

  if (isNaN(totalSeconds)) return 'N/A';

  // If it's less than a minute, just return the seconds
  if (totalSeconds < 60) {
    return `${totalSeconds} Sec`;
  }

  // Calculate minutes and remaining seconds
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Add a leading zero to seconds if needed (so it shows 41:04 instead of 41:4)
  const paddedSeconds = seconds.toString().padStart(2, '0');

  return `${minutes}:${paddedSeconds} Min`;
};
const sessions = await GameSession.find(filter).sort({highestSpeed:-1,timeTaken:1}).populate("userId","firstName lastName email country status phoneNumber")
 const leaderboard = sessions.map((session, index) => ({
      rank: index + 1,
      firstName: session.userId.firstName,
      lastName: session.userId.lastName,
      email: session.userId.email,
      highestSpeed: session.highestSpeed,
      timeTaken: formatTimeTaken(session.timeTaken),
      completedAt: session.completedAt,
      country: session.userId.country,
      status: session.userId.status ? "Active" : "Inactive",
      phoneNumber: session.userId.phoneNumber,
      
    })

  );




    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Leaderboard");

    worksheet.addRow([
      "Rank",
      "First Name",
      "Last Name",
      "Email",
      "Highest Speed",
      "Time Taken",
      "Completed At",
      "Country",
      "Status",
      "Phone Number",
    ]);

    leaderboard.forEach((row, index) => {
      worksheet.addRow([
        index + 1,
        row.firstName,
        row.lastName,
        row.email,
        row.highestSpeed,
        row.timeTaken,
        row.completedAt,
        row.country,
        row.status,
        row.phoneNumber,
      ]);
    });


    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=leaderboard.xlsx");
    res.send(buffer);

 res.end();

  
  } catch (error) {

    console.log(error)  
      res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}









