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
exports.finishGameDirect = async (req, res) => {
  try {
    const userId = req.user._id;
    const { highestSpeed, timeTaken, vehicle } = req.body;

    // ✅ Validation (allow 0 values)
    if (highestSpeed == null || timeTaken == null) {
      return res.status(400).json({
        success: false,
        message: "highestSpeed and timeTaken are required",
        errorCode: "VALIDATION_ERROR"
      });
    }

    // 🔍 Check user
    const userExist = await User.findById(userId);

    if (!userExist) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errorCode: "USER_NOT_FOUND"
      });
    }

    // ✅ Create session
    const session = await GameSession.create({
      userId,
      highestSpeed,
      timeTaken,
      vehicle,
      status: "COMPLETED",
      completedAt: new Date(),
    });

    // 🏁 Get latest session for this user
    const latestUserSession = await GameSession.findOne({
      userId,
      status: "COMPLETED",
    }).sort({ completedAt: -1, _id: -1 });

    // 🏆 Calculate rank
    const betterUsers = await GameSession.aggregate([
      { $match: { status: "COMPLETED" } },

      // best session per user
      { $sort: { timeTaken: 1, highestSpeed: -1, completedAt: -1, _id: -1 } },
      {
        $group: {
          _id: "$userId",
          bestSession: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$bestSession" } },

      // join user
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // only active users
      {
        $match: {
          "user.status": true,
        },
      },

      // better players
      {
        $match: {
          $or: [
            { timeTaken: { $lt: latestUserSession.timeTaken } },
            {
              timeTaken: latestUserSession.timeTaken,
              highestSpeed: { $gt: latestUserSession.highestSpeed },
            },
            {
              timeTaken: latestUserSession.timeTaken,
              highestSpeed: latestUserSession.highestSpeed,
              completedAt: { $gt: latestUserSession.completedAt },
            }
          ],
        },
      },

      { $count: "count" },
    ]);

    const rank = (betterUsers[0]?.count || 0) + 1;

    // ⭐ NEW: Fetch the user's all-time personal best
    // Sort by lowest time taken first. If tied, sort by highest speed.
    const bestScore = await GameSession.findOne({
      userId,
      status: "COMPLETED"
    }).sort({ timeTaken: 1, highestSpeed: -1, completedAt: -1, _id: -1 });

    // 🏆 Calculate rank for best score
    const betterUsersBestScore = await GameSession.aggregate([
      { $match: { status: "COMPLETED" } },

      // best session per user
      { $sort: { timeTaken: 1, highestSpeed: -1, completedAt: -1, _id: -1 } },
      {
        $group: {
          _id: "$userId",
          bestSession: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$bestSession" } },

      // join user
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // only active users
      {
        $match: {
          "user.status": true,
        },
      },

      // better players
      {
        $match: {
          $or: [
            { timeTaken: { $lt: bestScore.timeTaken } },
            {
              timeTaken: bestScore.timeTaken,
              highestSpeed: { $gt: bestScore.highestSpeed },
            },
            {
              timeTaken: bestScore.timeTaken,
              highestSpeed: bestScore.highestSpeed,
              completedAt: { $gt: bestScore.completedAt },
            }
          ],
        },
      },

      { $count: "count" },
    ]);

    const bestScoreRank = (betterUsersBestScore[0]?.count || 0) + 1;

    // ✅ Response
    return res.status(201).json({
      success: true,
      message: "Game saved successfully",
      data: {
        user: `${userExist.firstName || ''} ${userExist.lastName || ''}`.trim(),
        session: {
          _id: session._id,
          highestSpeed: session.highestSpeed,
          timeTaken: session.timeTaken,
          vehicle: session.vehicle,
          status: session.status,
          completedAt: session.completedAt
        },
        
        rank,
        bestScore: {
          _id: bestScore._id,
          highestSpeed: bestScore.highestSpeed,
          timeTaken: bestScore.timeTaken,
          vehicle: bestScore.vehicle,
          completedAt: bestScore.completedAt,
          rank: bestScoreRank
        } // Added bestScore to the response
      }
    });

  } catch (error) {
    console.error("Finish Game Direct Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errorCode: "SERVER_ERROR"
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

    // 1. Setup the search match stage for Users
    let matchStage = {};
    if (filterBy && searchQuery) {
      if (filterBy === "email") {
        matchStage.email = { $regex: searchQuery, $options: "i" };
      } else if (filterBy === "country") {
        matchStage.country = { $regex: searchQuery, $options: "i" };
      } else if (filterBy === "name") {
        matchStage.$or = [
          { firstName: { $regex: searchQuery, $options: "i" } },
          { lastName: { $regex: searchQuery, $options: "i" } }
        ];
      }
    }

    // 2. Build the Aggregation Pipeline
    const pipeline = [
      { $match: matchStage }, // Filter users based on search
      {
        // Join with GameSession collection
        $lookup: {
          from: "gamesessions", // MongoDB automatically pluralizes mongoose models to lowercase
          localField: "_id",
          foreignField: "userId",
          pipeline: [
            { $match: { status: "COMPLETED" } }, // Only get completed sessions
            { $sort: { highestSpeed: -1, timeTaken: 1 } }, // Best score first
            { $limit: 1 } // Only grab the user's best session if they played multiple times
          ],
          as: "sessionData"
        }
      },
      {
        // Flatten the array from $lookup, but KEEP users who have no session
        $unwind: {
          path: "$sessionData",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        // Sort: Top players first, then non-players sorted by newest accounts
        $sort: {
          "sessionData.highestSpeed": -1,
          "sessionData.timeTaken": 1,
          createdAt: -1
        }
      },
      {
        // Facet allows us to get the total count AND the paginated data in one database call
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ];

    const result = await User.aggregate(pipeline);

    // Extract total count and data safely
    const data = result[0].data;
    const total = result[0].metadata[0]?.total || 0;

    // 3. Map the data for the frontend
    const leaderboard = data.map((user, index) => {
      // Check if they actually have a completed game session
      const hasPlayed = !!user.sessionData;

      return {
        // If they played, calculate rank. If not, output "-" or "N/A"
        rank: hasPlayed ? skip + index + 1 : "-", 
        
        id: user._id, // Renamed to id to match your React frontend expected prop
        firstName: user.firstName,
        lastName: user.lastName || "",
        email: user.email,
        country: user.country || "N/A",
        status: user.status,
        phoneNumber: user.phoneNumber || "N/A",
          registerDate: user.createdAt || "N/A",
        
        // Game stats fallback to "N/A" if they never participated
        highestSpeed: hasPlayed ? user.sessionData.highestSpeed : "N/A",
        timeTaken: hasPlayed ? user.sessionData.timeTaken : "N/A",
        completedAt: hasPlayed ? user.sessionData.completedAt : null,
      };
    });

    res.status(200).json({
      success: true,
      leaderboard,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Leaderboard Aggregation Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// exports.dowloadLeaderBoard = async(req,res) =>{

//   try {
//  const { startDate, endDate } = req.query;


//  if(!startDate || !endDate){
//     return res.status(400).json({message:"Please provide start and end date"})
//   }
//  let filter = { status: "COMPLETED" };
// if(startDate && endDate){
//   filter.completedAt = {
//     $gte: new Date(startDate),
//     $lte: new Date(endDate),
//   }
// }



// const formatTimeTaken = (rawSeconds) => {
//   if (rawSeconds === null || rawSeconds === undefined) return 'N/A';

//   // Make sure we are working with a clean number
//   const totalSeconds = parseInt(rawSeconds, 10);

//   if (isNaN(totalSeconds)) return 'N/A';

//   // If it's less than a minute, just return the seconds
//   if (totalSeconds < 60) {
//     return `${totalSeconds} Sec`;
//   }

//   // Calculate minutes and remaining seconds
//   const minutes = Math.floor(totalSeconds / 60);
//   const seconds = totalSeconds % 60;

//   // Add a leading zero to seconds if needed (so it shows 41:04 instead of 41:4)
//   const paddedSeconds = seconds.toString().padStart(2, '0');

//   return `${minutes}:${paddedSeconds} Min`;
// };
// const sessions = await GameSession.find(filter).sort({highestSpeed:-1,timeTaken:1}).populate("userId","firstName lastName email country status phoneNumber")
//  const leaderboard = sessions.map((session, index) => ({
//       rank: index + 1,
//       firstName: session.userId.firstName,
//       lastName: session.userId.lastName,
//       email: session.userId.email,
//       highestSpeed: session.highestSpeed,
//       timeTaken: formatTimeTaken(session.timeTaken),
//       completedAt: session.completedAt,
//       country: session.userId.country,
//       status: session.userId.status ? "Active" : "Inactive",
//       phoneNumber: session.userId.phoneNumber,
      
//     })

//   );




//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Leaderboard");

//     worksheet.addRow([
//       "Rank",
//       "First Name",
//       "Last Name",
//       "Email",
//       "Highest Speed",
//       "Time Taken",
//       "Completed At",
//       "Country",
//       "Status",
//       "Phone Number",
//     ]);

//     leaderboard.forEach((row, index) => {
//       worksheet.addRow([
//         index + 1,
//         row.firstName,
//         row.lastName,
//         row.email,
//         row.highestSpeed,
//         row.timeTaken,
//         row.completedAt,
//         row.country,
//         row.status,
//         row.phoneNumber,
//       ]);
//     });


//     worksheet.columns.forEach((column) => {
//       column.width = 20;
//     });

//     const buffer = await workbook.xlsx.writeBuffer();

//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//     res.setHeader("Content-Disposition", "attachment; filename=leaderboard.xlsx");
//     res.send(buffer);

//  res.end();

  
//   } catch (error) {

//     console.log(error)  
//       res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

exports.dowloadLeaderBoard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Build the specific match for the Game Sessions
    let sessionMatch = { status: "COMPLETED" };
    
    // Check if valid dates were passed
    if (startDate && endDate && startDate !== "undefined" && endDate !== "undefined" && startDate !== "null") {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      sessionMatch.completedAt = {
        $gte: new Date(startDate),
        $lte: endOfDay,
      };
    }

    // 2. Execute Aggregation (Exactly like getGameLeaderBord, just no pagination!)
    const data = await User.aggregate([
      // Assuming you want active users only. Remove if you want all.
      { $match: { status: true } }, 
      {
        $lookup: {
          from: "gamesessions", 
          localField: "_id",
          foreignField: "userId",
          pipeline: [
            { $match: sessionMatch }, // Applies the date range filter
            // EXACT SAME SORT AS UI:
            { $sort: { highestSpeed: -1, timeTaken: 1 } }, 
            { $limit: 1 } 
          ],
          as: "sessionData"
        }
      },
      {
        $unwind: {
          path: "$sessionData",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        // EXACT SAME SORT AS UI: 
        // Players naturally go to the top, non-players (null) drop to the bottom
        $sort: {
          "sessionData.highestSpeed": -1,
          "sessionData.timeTaken": 1,
          createdAt: -1
        }
      }
    ]);

    // 3. Time Formatter Helper
    const formatTimeTaken = (rawSeconds) => {
      if (rawSeconds === null || rawSeconds === undefined || rawSeconds === "N/A") return 'N/A';
      const totalSeconds = parseInt(rawSeconds, 10);
      if (isNaN(totalSeconds)) return 'N/A';
      if (totalSeconds < 60) return `${totalSeconds} Sec`;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const paddedSeconds = seconds.toString().padStart(2, '0');
      return `${minutes}:${paddedSeconds} Min`;
    };

    // 4. Map the data cleanly for Excel (Exactly like the UI logic!)
    const leaderboard = data.map((user, index) => {
      const hasPlayed = !!user.sessionData;

      // Rank Formatting
      const rawRank = hasPlayed ? index + 1 : "-";
      const formattedRank = rawRank === "-" ? "-" : String(rawRank).padStart(2, '0');

      // Date Formatting
      const formattedDate = hasPlayed && user.sessionData.completedAt
        ? new Date(user.sessionData.completedAt).toLocaleString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', hour12: true 
          })
        : "N/A";

      return {
        rank: formattedRank, 
        firstName: user.firstName || "N/A",
        lastName: user.lastName || "",
        email: user.email || "N/A",
        highestSpeed: hasPlayed ? `${user.sessionData.highestSpeed} KM/H` : "N/A",
        timeTaken: hasPlayed ? formatTimeTaken(user.sessionData.timeTaken) : "N/A",
        completedAt: formattedDate,
        country: user.country || "N/A",
        status: user.status ? "Active" : "Inactive",
        phoneNumber: user.phoneNumber || "N/A",
      };
    });

    // 5. Build the Excel Document
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Leaderboard");

    worksheet.columns = [
      { header: "Rank", key: "rank", width: 10 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Highest Speed", key: "highestSpeed", width: 15 },
      { header: "Time Taken", key: "timeTaken", width: 15 },
      { header: "Completed At", key: "completedAt", width: 25 },
      { header: "Country", key: "country", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Phone Number", key: "phoneNumber", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    leaderboard.forEach((row) => {
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const fileName = (startDate && startDate !== "undefined") 
      ? `leaderboard_${startDate}_to_${endDate}.xlsx` 
      : `leaderboard_all_time.xlsx`;
      
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    
    return res.send(buffer);

  } catch (error) {
    console.error("Excel Download Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.dowloadLeaderBoard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Build the specific match for the Game Sessions
    let sessionMatch = { status: "COMPLETED" };
    
    // SAFETY CHECK: Ensure dates exist and aren't "undefined" strings from the frontend
    if (startDate && endDate && startDate !== "undefined" && endDate !== "undefined" && startDate !== "null") {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      sessionMatch.completedAt = {
        $gte: new Date(startDate),
        $lte: endOfDay,
      };
    }

    // 2. Execute the Left Outer Join Aggregation
    const data = await User.aggregate([
      { $match: { status: true } },

      {
        $lookup: {
          from: "gamesessions", 
          localField: "_id",
          foreignField: "userId",
          pipeline: [
            { $match: sessionMatch }, 
            { $sort: { timeTaken: 1, highestSpeed: -1, completedAt: -1 } },
            { $limit: 1 } 
          ],
          as: "sessionData"
        }
      },
      {
        // BULLETPROOF FIX: Check the size of the array BEFORE unwinding!
        // If the size is greater than 0, they have played.
        $addFields: {
          hasPlayed: { $cond: [{ $gt: [{ $size: "$sessionData" }, 0] }, 1, 0] }
        }
      },
      {
        $unwind: {
          path: "$sessionData",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $sort: {
          hasPlayed: -1,                   
          "sessionData.timeTaken": 1,      
          "sessionData.highestSpeed": -1,  
          "sessionData.completedAt": -1,   
          createdAt: -1                    
        }
      }
    ]);

    // 3. Time Formatter Helper
    const formatTimeTaken = (rawSeconds) => {
      if (rawSeconds === null || rawSeconds === undefined || rawSeconds === "N/A") return 'N/A';
      const totalSeconds = parseInt(rawSeconds, 10);
      if (isNaN(totalSeconds)) return 'N/A';
      if (totalSeconds < 60) return `${totalSeconds} Sec`;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const paddedSeconds = seconds.toString().padStart(2, '0');
      return `${minutes}:${paddedSeconds} Min`;
    };

    // 4. Map the data cleanly for Excel
    const leaderboard = data.map((user, index) => {
      const played = user.hasPlayed === 1;

      const rawRank = played ? index + 1 : "-";
      const formattedRank = rawRank === "-" ? "-" : String(rawRank).padStart(2, '0');

      const formattedDate = played && user.sessionData.completedAt
        ? new Date(user.sessionData.completedAt).toLocaleString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', hour12: true 
          })
        : "N/A";

      return {
        rank: formattedRank, 
        firstName: user.firstName || "N/A",
        lastName: user.lastName || "",
        email: user.email || "N/A",
        highestSpeed: played ? `${user.sessionData.highestSpeed} KM/H` : "N/A",
        timeTaken: played ? formatTimeTaken(user.sessionData.timeTaken) : "N/A",
        completedAt: formattedDate,
        country: user.country || "N/A",
        status: user.status ? "Active" : "Inactive",
        phoneNumber: user.phoneNumber || "N/A",
      };
    });
   console.log(leaderboard)
    // 5. Build the Excel Document
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Leaderboard");

    worksheet.columns = [
      { header: "Rank", key: "rank", width: 10 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Highest Speed", key: "highestSpeed", width: 15 },
      { header: "Time Taken", key: "timeTaken", width: 15 },
      { header: "Completed At", key: "completedAt", width: 25 },
      { header: "Country", key: "country", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Phone Number", key: "phoneNumber", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    leaderboard.forEach((row) => {
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    // Fallback name if dates are missing
    const fileName = (startDate && startDate !== "undefined") 
      ? `leaderboard_${startDate}_to_${endDate}.xlsx` 
      : `leaderboard_all_time.xlsx`;
      
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    
    return res.send(buffer);

  } catch (error) {
    console.error("Excel Download Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getActiveLeaderboard = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, parseInt(limit) || 10);

    const skip = (page - 1) * limit;

const basePipeline = [
  { $match: { status: "COMPLETED" } },

  // ✅ Find the user's best session by lowest time taken
  { $sort: { timeTaken: 1, highestSpeed: -1, completedAt: -1, _id: -1 } },

  {
    $group: {
      _id: "$userId",
      bestSession: { $first: "$$ROOT" },
    },
  },

  { $replaceRoot: { newRoot: "$bestSession" } },

  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
    },
  },

  { $unwind: "$user" },

  { $match: { "user.status": true } },

  {
    $sort: {
      timeTaken: 1,
      highestSpeed: -1,
      completedAt: -1,
    },
  },
];
    // ✅ leaderboard data
    const leaderboard = await GameSession.aggregate([
      ...basePipeline,
      { $skip: skip },
      { $limit: limit },
    ]);

    // ✅ correct total (same pipeline without pagination)
    const totalResult = await GameSession.aggregate([
      ...basePipeline,
      { $count: "total" },
    ]);

    const total = totalResult[0]?.total || 0;

    // 🎯 format
    const formatted = leaderboard.map((item, index) => ({
      rank: skip + index + 1, // page rank (UI use)
      user: item.user._id,
      firstName: item.user.firstName,
      lastName: item.user.lastName,
      email: item.user.email,
      highestSpeed: item.highestSpeed,
      timeTaken: item.timeTaken,
      completedAt: item.completedAt,
      country: item.user.country,
      phoneNumber: item.user.phoneNumber,
    }));

    return res.status(200).json({
      success: true,
      leaderboard: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



