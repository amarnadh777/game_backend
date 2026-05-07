const User = require("../models/UserModel");
const GameSession = require("../models/gameSessionModel");
const ExcelJS = require("exceljs");

exports.startGame = async (req, res) => {
  try {
    const userId = req.user._id;
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
    const userId = req.user._id;
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

    // ✅ Convert to number + keep 2 decimal places
    const parsedTime = Number(Number(timeTaken).toFixed(2));

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

    // ✅ Create session (FIXED HERE 👇)
    const session = await GameSession.create({
      userId,
      highestSpeed,
      timeTaken: parsedTime, // ✅ FIX APPLIED
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

    // ⭐ Best score
    const bestScore = await GameSession.findOne({
      userId,
      status: "COMPLETED"
    }).sort({ timeTaken: 1, highestSpeed: -1, completedAt: -1, _id: -1 });

    // 🏆 Rank for best score
    const betterUsersBestScore = await GameSession.aggregate([
      { $match: { status: "COMPLETED" } },

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
          timeTaken: session.timeTaken, // ✅ will be 2 decimal
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
        }
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
    let {
      page = 1,
      limit = 10,
      filterBy,
      searchQuery,
      startDate,
      endDate,
      sortBy,
      sortOrder
    } = req.query;

    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, parseInt(limit) || 10);
    const skip = (page - 1) * limit;

    // Match stage
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
      } else if (filterBy === "phoneNumber") {
        // IMPORTANT: Escape the '+' sign so it doesn't break the regex
        const safeQuery = searchQuery.replace(/\+/g, "\\+");
        matchStage.phoneNumber = { $regex: safeQuery, $options: "i" };
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    // Dynamic sorting
    let sortStage = {};

    if (sortBy === 'speed') {
      const order = sortOrder === 'asc' ? 1 : -1;
      sortStage = {
        "sessionData.highestSpeed": order,
        "sessionData.timeTaken": 1
      };
    }
    else if (sortBy === 'finished') {
      const order = sortOrder === 'asc' ? 1 : -1;
      sortStage = {
        "sessionData.timeTaken": order,
        "sessionData.highestSpeed": -1
      };
    }
    else {
      sortStage = {
        "sessionData.timeTaken": 1,
        createdAt: -1
      };
    }

    // Pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "gamesessions", // Double check that this matches your actual collection name in MongoDB!
          localField: "_id",
          foreignField: "userId",
          pipeline: [
            { $match: { status: "COMPLETED" } },
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
      // Push users with no session to the bottom
      {
        $addFields: {
          hasPlayed: {
            $cond: [{ $ifNull: ["$sessionData", false] }, 1, 0]
          }
        }
      },
      {
        $sort: {
          hasPlayed: -1,
          ...sortStage
        }
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ];

    const result = await User.aggregate(pipeline);

    const data = result[0].data || [];
    const total = result[0].metadata[0]?.total || 0;

    const leaderboard = data.map((user, index) => {
      const hasPlayed = !!user.sessionData;

      return {
        rank: hasPlayed ? skip + index + 1 : "-",
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName || "",
        email: user.email,
        country: user.country || "N/A",
        status: user.status,
        phoneNumber: user.phoneNumber || "N/A",
        registerDate: user.createdAt || "N/A",
        phoneCode: user.phoneCode || "",
        highestSpeed: hasPlayed ? user.sessionData.highestSpeed : "N/A",
        timeTaken: hasPlayed ? user.sessionData.timeTaken : "N/A",
        completedAt: hasPlayed ? user.sessionData.completedAt : null,
        vehicle: hasPlayed ? (user.sessionData.vehicle || "N/A") : "N/A",
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

      // ✅ IMPORTANT FIX: force timeTaken to number (handles string + float safely)
      {
        $addFields: {
          timeTaken: { $toDouble: "$timeTaken" }
        }
      },

      // ✅ Find best session per user
      { $sort: { timeTaken: 1, highestSpeed: -1, completedAt: -1, _id: -1 } },

      {
        $group: {
          _id: "$userId",
          bestSession: { $first: "$$ROOT" },
        },
      },

      { $replaceRoot: { newRoot: "$bestSession" } },

      // 👤 Join user
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      { $unwind: "$user" },

      // ✅ Only active users
      { $match: { "user.status": true } },

      // ✅ Final ranking sort
      {
        $sort: {
          timeTaken: 1,
          highestSpeed: -1,
          completedAt: -1,
        },
      },
    ];

    // 🏆 leaderboard data
    const leaderboard = await GameSession.aggregate([
      ...basePipeline,
      { $skip: skip },
      { $limit: limit },
    ]);

    // 📊 total count
    const totalResult = await GameSession.aggregate([
      ...basePipeline,
      { $count: "total" },
    ]);

    const total = totalResult[0]?.total || 0;

    // 🎯 format response
    const formatted = leaderboard.map((item, index) => ({
      rank: skip + index + 1,
      user: item.user._id,
      firstName: item.user.firstName,
      lastName: item.user.lastName,
      email: item.user.email,
      highestSpeed: item.highestSpeed,

      // ✅ OPTIONAL: clean decimal (remove if you want raw value)
      timeTaken: Number(item.timeTaken.toFixed(2)),

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



