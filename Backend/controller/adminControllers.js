const GameSession = require("../models/gameSessionModel");
const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const getDateRange = require("../utils/utils");
const crypto = require('crypto');
const brevoSendMail = require("../helper/sendEmailBrevo");
const awsSendMail = require("../helper/awsSendMail");
exports.analytics = async (req, res) => {
  try {
    // Dates for "Today vs Yesterday" growth calculations
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // Date for weekly graph (Always last 7 days for the main dashboard overview)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ==========================================
    // 1. RUN QUERIES IN PARALLEL (ALL-TIME DATA)
    // ==========================================
    const [
      CountUser,
      currentParticipantsData,
      replaydata,
      mostUsedVehicleData,
      dailyParticipantsData,
      hourlyParticipantsData,
      vehicleCounts,
      countryCounts
    ] = await Promise.all([
      // 1. Total Lifetime Users
      User.countDocuments(),

      // 2. Total Unique Participants (ALL-TIME)
      GameSession.aggregate([
        { $match: { status: "COMPLETED" } },
        { $group: { _id: "$userId" } },
        { $count: "total_participants" },
      ]),

      // 3. Replay Data (ALL-TIME)
      GameSession.aggregate([
        { $match: { status: "COMPLETED" } },
        { $group: { _id: "$userId", totalPlays: { $sum: 1 } } },
        { $match: { totalPlays: { $gt: 1 } } },
        { $project: { replays: { $subtract: ["$totalPlays", 1] } } },
      ]),

      // 4. Most Used Vehicle (ALL-TIME)
      GameSession.aggregate([
        { $match: { status: "COMPLETED", vehicle: { $exists: true, $ne: null } } },
        { $group: { _id: "$vehicle", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),

      // 5. Weekly Graph Data (Hardcoded to last 7 days)
      GameSession.aggregate([
        { $match: { status: "COMPLETED", completedAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { dayOfWeek: { $dayOfWeek: "$completedAt" }, userId: "$userId" } } },
        { $group: { _id: "$_id.dayOfWeek", participantsCount: { $sum: 1 } } },
      ]),

      // 6. Hourly Graph Data (ALL-TIME)
      GameSession.aggregate([
        { $match: { status: "COMPLETED" } },
        { $group: { _id: { $hour: "$completedAt" }, participantsCount: { $sum: 1 } } },
      ]),

      // 7. Specific Vehicle Counts (ALL-TIME)
      GameSession.aggregate([
        {
          $match: {
            status: "COMPLETED",
            vehicle: { $in: ["toyota_land_cruiser_gx_r_3_5l", "lexus_lx_600_urban", "icaur_v27_royal", "deepal_g318", "jetour_g700"] },
          },
        },
        { $group: { _id: "$vehicle", count: { $sum: 1 } } },
      ]),

      // 8. Country Counts (ALL-TIME)
      GameSession.aggregate([
        { $match: { status: "COMPLETED" } },
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $match: { "user.country": { $exists: true, $ne: null, $ne: "" } } },
        { $group: { _id: { userId: "$userId", country: "$user.country" } } },
        { $group: { _id: "$_id.country", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // ==========================================
    // 2. PROCESS RESULTS
    // ==========================================
    const weeklyGraphData = [
      { day: "Mon", participants: 0 }, { day: "Tue", participants: 0 }, { day: "Wed", participants: 0 },
      { day: "Thu", participants: 0 }, { day: "Fri", participants: 0 }, { day: "Sat", participants: 0 }, { day: "Sun", participants: 0 },
    ];
    dailyParticipantsData.forEach((data) => {
      const mongoDay = data._id;
      const arrayIndex = mongoDay === 1 ? 6 : mongoDay - 2;
      weeklyGraphData[arrayIndex].participants = data.participantsCount;
    });

    const timingGraphData = [
      { time: "8am", participants: 0 }, { time: "10am", participants: 0 }, { time: "12pm", participants: 0 },
      { time: "2pm", participants: 0 }, { time: "4pm", participants: 0 }, { time: "6pm", participants: 0 }, { time: "8pm", participants: 0 },
    ];
    hourlyParticipantsData.forEach((data) => {
      const hour = data._id;
      const count = data.participantsCount;
      if (hour >= 8 && hour < 10) timingGraphData[0].participants += count;
      else if (hour >= 10 && hour < 12) timingGraphData[1].participants += count;
      else if (hour >= 12 && hour < 14) timingGraphData[2].participants += count;
      else if (hour >= 14 && hour < 16) timingGraphData[3].participants += count;
      else if (hour >= 16 && hour < 18) timingGraphData[4].participants += count;
      else if (hour >= 18 && hour < 20) timingGraphData[5].participants += count;
      else if (hour >= 20 && hour < 22) timingGraphData[6].participants += count;
    });

    const mostPlayedVehicles = [
      { name: "toyota_land_cruiser_gx_r_3_5l", count: 0 }, { name: "lexus_lx_600_urban", count: 0 },
      { name: "icaur_v27_royal", count: 0 }, { name: "deepal_g318", count: 0 }, { name: "jetour_g700", count: 0 },
    ];
    vehicleCounts.forEach((item) => {
      const vehicle = mostPlayedVehicles.find((v) => v.name === item._id);
      if (vehicle) vehicle.count = item.count;
    });

    const participantsByCountry = countryCounts.map((item) => ({ country: item._id, count: item.count }));
    const totalParticipants = currentParticipantsData.length > 0 ? currentParticipantsData[0].total_participants : 0;
    const totalReplays = replaydata.reduce((acc, curr) => acc + curr.replays, 0);
    const mostUsedVehicle = mostUsedVehicleData.length > 0 ? mostUsedVehicleData[0]._id : null;

    // ==========================================
    // 3. GROWTH CALCULATIONS (Today vs Yesterday)
    // ==========================================
    const calculatePercentage = (today, yesterday) => {
      if (yesterday === 0) return today > 0 ? 100 : 0;
      return Number((((today - yesterday) / yesterday) * 100).toFixed(1));
    };

    const usersToday = await User.countDocuments({ createdAt: { $gte: startOfToday } });
    const usersYesterday = await User.countDocuments({ createdAt: { $gte: startOfYesterday, $lt: startOfToday } });
    const registrationGrowth = calculatePercentage(usersToday, usersYesterday);

    const partsTodayAgg = await GameSession.aggregate([
      { $match: { status: "COMPLETED", completedAt: { $gte: startOfToday } } },
      { $group: { _id: "$userId" } }, { $count: "count" }
    ]);
    const partsToday = partsTodayAgg.length > 0 ? partsTodayAgg[0].count : 0;

    const partsYestAgg = await GameSession.aggregate([
      { $match: { status: "COMPLETED", completedAt: { $gte: startOfYesterday, $lt: startOfToday } } },
      { $group: { _id: "$userId" } }, { $count: "count" }
    ]);
    const partsYesterday = partsYestAgg.length > 0 ? partsYestAgg[0].count : 0;

    const participantGrowth = calculatePercentage(partsToday, partsYesterday);

    const sessionsToday = await GameSession.countDocuments({ status: "COMPLETED", completedAt: { $gte: startOfToday } });
    const replaysToday = Math.max(0, sessionsToday - partsToday);

    const sessionsYesterday = await GameSession.countDocuments({ status: "COMPLETED", completedAt: { $gte: startOfYesterday, $lt: startOfToday } });
    const replaysYesterday = Math.max(0, sessionsYesterday - partsYesterday);

    const replayGrowth = calculatePercentage(replaysToday, replaysYesterday);

    // ==========================================
    // RETURN DATA
    // ==========================================
    return res.status(200).json({
      success: true,
      message: "Analytics data fetched successfully",
      data: {
        totalUsers: CountUser,
        totalParticipants,
        totalReplays,
        mostUsedVehicle,
        registrationGrowth,
        participantGrowth,
        replayGrowth,
        weeklyGraphData,
        timingGraphData,
        mostPlayedVehicles,
        participantsByCountry,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getParticipantsGraphData = async (req, res) => {
  try {
    const { filter = 'all', startDate: customStart, endDate: customEnd } = req.query;

    // 1. Get dates. (Assuming getDateRange returns local midnight-to-midnight Date objects)
    const { startDate, endDate } = getDateRange(filter, customStart, customEnd);

    // Guard clause: If 'all' is selected and there's no start date, return empty or handle differently
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Valid date range required" });
    }

    // 2. Get raw data from MongoDB grouped by exact Date
    const dailyData = await GameSession.aggregate([
      {
        $match: {
          status: "COMPLETED",
          completedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            // FIXED: Added timezone to ensure it groups by your local day, not UTC
            // Change "Asia/Kolkata" to your actual timezone if you aren't in India
            dateStr: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$completedAt",
                timezone: "Asia/Kolkata"
              }
            },
            userId: "$userId"
          }
        }
      },
      {
        $group: {
          _id: "$_id.dateStr",
          participantsCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Generate the continuous array
    const chartData = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      // FIXED: Safely extract Local YYYY-MM-DD instead of using UTC toISOString()
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      // Find if we have data for this day from DB
      const dbRecord = dailyData.find((d) => d._id === dateString);

      // Create a nice label for the frontend graph
      const isWeekFilter = filter === 'this_week' || filter === 'last_week';

      // If it's just "today", we can format it to say "Today" or show the hour
      let label = "";
      if (filter === 'today') {
        label = "Today";
      } else {
        label = isWeekFilter
          ? currentDate.toLocaleDateString('en-US', { weekday: 'short' })
          : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      chartData.push({
        day: label,
        participants: dbRecord ? dbRecord.participantsCount : 0
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return res.status(200).json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error("Participants Graph Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getStatsCardsData = async (req, res) => {
  try {
    const { timeframe = 'all', from, to } = req.query;

    // ==========================================
    // 1. GET CURRENT DATES (Using your utility)
    // ==========================================
    let currentStart = null;
    let currentEnd = null;

    if (timeframe !== 'all') {
      const { startDate, endDate } = getDateRange(timeframe, from, to);
      currentStart = startDate;
      currentEnd = endDate;
    }

    // ==========================================
    // 2. CALCULATE PREVIOUS DATES & TREND LABEL
    // ==========================================
    let prevStart = null;
    let prevEnd = null;
    let trendLabel = null; // NEW: Dynamic text for the frontend

    if (timeframe === 'today') {
      prevStart = new Date(currentStart); prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(currentEnd); prevEnd.setDate(prevEnd.getDate() - 1);
      trendLabel = "vs yesterday";
    } else if (timeframe === 'this_week') {
      prevStart = new Date(currentStart); prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(currentStart); prevEnd.setMilliseconds(-1);
      trendLabel = "vs last week";
    } else if (timeframe === 'last_week') {
      prevStart = new Date(currentStart); prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(currentStart); prevEnd.setMilliseconds(-1);
      trendLabel = "vs previous week";
    } else if (timeframe === 'this_month') {
      prevStart = new Date(currentStart); prevStart.setMonth(prevStart.getMonth() - 1);
      prevEnd = new Date(currentStart); prevEnd.setMilliseconds(-1);
      trendLabel = "vs last month";
    } else if (timeframe === 'last_month') {
      prevStart = new Date(currentStart); prevStart.setMonth(prevStart.getMonth() - 1);
      prevEnd = new Date(currentStart); prevEnd.setMilliseconds(-1);
      trendLabel = "vs previous month";
    }
    // For 'all' and 'custom', prevStart/prevEnd stay null, and trendLabel stays null.

    // ==========================================
    // 3. BUILD MONGODB FILTERS
    // ==========================================
    const buildMatch = (start, end, isSession = false) => {
      if (!start || !end) return isSession ? { status: "COMPLETED" } : {};
      const dateField = isSession ? "completedAt" : "createdAt";
      return { ...(isSession && { status: "COMPLETED" }), [dateField]: { $gte: start, $lte: end } };
    };

    const currentMatchUser = buildMatch(currentStart, currentEnd, false);
    const currentMatchSession = buildMatch(currentStart, currentEnd, true);

    // ==========================================
    // 4. FETCH CURRENT DATA
    // ==========================================
    const [
      totalUsers,
      participantsAgg,
      totalSessions,
      vehicleAgg
    ] = await Promise.all([
      User.countDocuments(currentMatchUser),
      GameSession.aggregate([{ $match: currentMatchSession }, { $group: { _id: "$userId" } }, { $count: "count" }]),
      GameSession.countDocuments(currentMatchSession),
      GameSession.aggregate([
        { $match: { ...currentMatchSession, vehicle: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$vehicle",
            count: { $sum: 1 },
            // NEW: Find the absolute fastest time recorded for this vehicle in this timeframe
            bestTime: { $min: "$timeTaken" }
          }
        },
        // NEW: Sort by count FIRST (highest to lowest), then by bestTime SECOND (lowest/fastest to highest)
        { $sort: { count: -1, bestTime: 1 } },
        { $limit: 1 }
      ])
    ]);

    const totalParticipants = participantsAgg.length > 0 ? participantsAgg[0].count : 0;
    const totalReplays = Math.max(0, totalSessions - totalParticipants);
    const mostUsedVehicle = vehicleAgg.length > 0 ? vehicleAgg[0]._id : null;

    // ==========================================
    // 5. FETCH PREVIOUS DATA & CALCULATE GROWTH
    // ==========================================
    // Default to null so frontend hides the arrow for Custom/All Time
    let registrationGrowth = null, participantGrowth = null, replayGrowth = null;

    const calculatePercentage = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    if (prevStart && prevEnd) {
      const prevMatchUser = buildMatch(prevStart, prevEnd, false);
      const prevMatchSession = buildMatch(prevStart, prevEnd, true);

      const [prevUsers, prevPartsAgg, prevSessions] = await Promise.all([
        User.countDocuments(prevMatchUser),
        GameSession.aggregate([{ $match: prevMatchSession }, { $group: { _id: "$userId" } }, { $count: "count" }]),
        GameSession.countDocuments(prevMatchSession)
      ]);

      const prevParticipants = prevPartsAgg.length > 0 ? prevPartsAgg[0].count : 0;
      const prevReplays = Math.max(0, prevSessions - prevParticipants);

      registrationGrowth = calculatePercentage(totalUsers, prevUsers);
      participantGrowth = calculatePercentage(totalParticipants, prevParticipants);
      replayGrowth = calculatePercentage(totalReplays, prevReplays);
    }

    // ==========================================
    // 6. SEND RESPONSE
    // ==========================================
    return res.status(200).json({
      success: true,
      data: {
        trendLabel, // Passes the text to React (e.g., "vs yesterday")
        totalUsers,
        registrationGrowth,
        totalParticipants,
        participantGrowth,
        totalReplays,
        replayGrowth,
        mostUsedVehicle // No growth data passed here, so frontend hides it automatically!
      }
    });

  } catch (error) {
    console.error("Stats Card Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTimingGraphData = async (req, res) => {
  try {
    const { filter = 'all', startDate: customStart, endDate: customEnd } = req.query;

    // 1. Create the base match object
    const baseMatch = { status: "COMPLETED" };

    // 2. Apply date ranges if the filter is NOT 'all'
    if (filter !== 'all' && filter !== 'all_time') {
      const { startDate, endDate } = getDateRange(filter, customStart, customEnd);

      if (startDate && endDate) {
        baseMatch.completedAt = { $gte: startDate, $lte: endDate };
      }
    }

    // 3. Fetch the raw data grouped by local hour (Fixing the UTC issue)
    const hourlyParticipantsData = await GameSession.aggregate([
      { $match: baseMatch },
      {
        $group: {
          // Convert the stored UTC time to Indian Standard Time before extracting the hour
          _id: { $hour: { date: "$completedAt", timezone: "Asia/Kolkata" } },
          participantsCount: { $sum: 1 },
        },
      },
    ]);

    // 4. Initialize buckets covering the FULL 24 hours (so no late-night players are ignored)
    const timingGraphData = [
      { time: "12am", participants: 0 },
      { time: "3am", participants: 0 },
      { time: "6am", participants: 0 },
      { time: "9am", participants: 0 },
      { time: "12pm", participants: 0 },
      { time: "3pm", participants: 0 },
      { time: "6pm", participants: 0 },
      { time: "9pm", participants: 0 },
    ];

    // 5. Populate the buckets
    hourlyParticipantsData.forEach((data) => {
      const hour = data._id; // This is now local IST hour (0 to 23)
      const count = data.participantsCount;

      if (hour >= 0 && hour < 3) timingGraphData[0].participants += count;
      else if (hour >= 3 && hour < 6) timingGraphData[1].participants += count;
      else if (hour >= 6 && hour < 9) timingGraphData[2].participants += count;
      else if (hour >= 9 && hour < 12) timingGraphData[3].participants += count;
      else if (hour >= 12 && hour < 15) timingGraphData[4].participants += count;
      else if (hour >= 15 && hour < 18) timingGraphData[5].participants += count;
      else if (hour >= 18 && hour < 21) timingGraphData[6].participants += count;
      else if (hour >= 21 && hour <= 23) timingGraphData[7].participants += count;
    });

    return res.status(200).json({
      success: true,
      data: timingGraphData,
    });
  } catch (error) {
    console.error("Timing Graph Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getVehicleGraphData = async (req, res) => {
  try {
    const { filter, startDate: customStart, endDate: customEnd } = req.query;

    // 1. Create the base match object FIRST
    const baseMatch = { status: "COMPLETED" };

    // 2. ONLY apply the date filter if a filter is actually requested
    // We also added a check so you can explicitly pass ?filter=all_time if you want
    if (filter && filter !== "all_time") {
      const { startDate, endDate } = getDateRange(filter, customStart, customEnd);
      if (startDate && endDate) {
        baseMatch.completedAt = { $gte: startDate, $lte: endDate };
      }
    }

    // 3. Fetch the vehicle counts from the database
    const vehicleCounts = await GameSession.aggregate([
      {
        $match: {
          ...baseMatch,
          // Only look for these specific vehicles
          vehicle: {
            $in: [
              "toyota_land_cruiser_gx_r_3_5l",
              "lexus_lx_600_urban",
              "icaur_v27_royal",
              "deepal_g318",
              "jetour_g700",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$vehicle",
          count: { $sum: 1 },
        },
      },
    ]);

    // 4. Initialize your baseline data structure
    const mostPlayedVehicles = [
      { name: "toyota_land_cruiser_gx_r_3_5l", count: 0 },
      { name: "lexus_lx_600_urban", count: 0 },
      { name: "icaur_v27_royal", count: 0 },
      { name: "deepal_g318", count: 0 },
      { name: "jetour_g700", count: 0 },
    ];

    // 5. Map the database results to your baseline structure
    vehicleCounts.forEach((item) => {
      const vehicle = mostPlayedVehicles.find((v) => v.name === item._id);
      if (vehicle) vehicle.count = item.count;
    });

    // 6. Return the data to the frontend
    return res.status(200).json({
      success: true,
      data: mostPlayedVehicles,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getCountryGraphData = async (req, res) => {
  try {
    const { filter, startDate: customStart, endDate: customEnd } = req.query;

    // 1. Initialize the base match object
    const baseMatch = { status: "COMPLETED" };

    // 2. Only apply date filtering if a valid filter is provided
    if (filter && filter !== "all_time") {
      const { startDate, endDate } = getDateRange(filter, customStart, customEnd);
      if (startDate && endDate) {
        baseMatch.completedAt = { $gte: startDate, $lte: endDate };
      }
    }

    // 3. Aggregate data joining Sessions with Users
    const countryCounts = await GameSession.aggregate([
      { $match: baseMatch },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          "user.country": { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        // Count unique participants per country
        $group: {
          _id: {
            userId: "$userId",
            country: "$user.country"
          }
        }
      },
      {
        $group: {
          _id: "$_id.country",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } }
    ]);

    const participantsByCountry = countryCounts.map((item) => ({
      country: item._id,
      count: item.count
    }));

    return res.status(200).json({
      success: true,
      data: participantsByCountry,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.creatAdmin = async (req, res) => {
  try {
    const { email, password, userName, fullname } = req.body;

    // 1. Check if ALL fields are provided
    if (!email || !password || !userName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (email, password, and username)",
      });
    }

    // 2. Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email: email }, { userName: userName }],
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email or username already exists",
      });
    }

    // 3. Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the new admin with the HASHED password
    const newAdmin = new Admin({
      email: email,
      password: hashedPassword,
      userName: userName,
      fullname: fullname
    });

    await newAdmin.save();

    // 5. Send success response (Exclude the password from the returned data!)
    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        id: newAdmin._id,
        email: newAdmin.email,
        userName: newAdmin.userName,
        fullname: newAdmin.fullname,
        isActive: newAdmin.isActive
      },
    });

  } catch (error) {
    console.error("Create Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}


exports.createAdminWithTempPassword = async (req, res) => {
  try {
    const { email, userName, fullname } = req.body;

    // 1. Validate fields
    if (!email || !userName || !fullname) {
      return res.status(400).json({
        success: false,
        message: "Email, username and fullname are required",
      });
    }

    // 2. Check existing admin
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email or username already exists",
      });
    }

    // 3. Generate temporary password
    const tempPassword = crypto.randomBytes(4).toString("hex");

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // 5. Create admin
    const newAdmin = new Admin({
      email,
      userName,
      fullname,
      password: hashedPassword,
      isTempPassword: true,
    });

    await newAdmin.save();
    const loginUrl = `${process.env.ADMIN_PANEL_URL}`;
    console.log("Admin Panel URL:", loginUrl, newAdmin);
    // 6. Send email
   // Check if the environment variable explicitly requests Brevo
if (process.env.EMAIL_PROVIDER === "BREVO") {
  // Send using Brevo
  seneMaillog = await brevoSendMail({
    to: email,
    subject: "Your Admin Account Created",
    html: emailHtml,
  });
} else {
  // Default to AWS SES for everything else (including if the variable is empty)
  seneMaillog = await awsSendMail({
    to: email,
    subject: "Your Admin Account Created",
    html: emailHtml,
  });
}


    return res.status(201).json({
      success: true,
      message: "Admin created and temporary password sent to email",
      data: {
        id: newAdmin._id,
        email: newAdmin.email,
        userName: newAdmin.userName,
        fullname: newAdmin.fullname,
        isActive: newAdmin.isActive
      },
    });

  } catch (error) {
    console.error("Create Admin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getAllAdminList = async (req, res) => {

  try {
    const adminList = await Admin.find({ role: "admin" });
    return res.status(200).json({
      success: true,
      data: adminList,
    });
  } catch (error) {
    console.error("Get All Admin List Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // 1. Check if password and at least one identifier (email or username) are provided
    if (!password || (!email && !username)) {
      return res.status(400).json({
        success: false,
        message: "Password and either an email or username are required",
      });
    }

    // 2. Find admin by email or userName
    const admin = await Admin.findOne({
      $or: [{ email: email }, { userName: username }],
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ==========================================
    // NEW CHECK: Prevent disabled admins from logging in
    // ==========================================
    if (admin.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled. Please contact an administrator.",
      });
    }

    // 3. Compare the provided password with the hashed password in the database
    const isPasswordMatch = await bcrypt.compare(password, admin.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET, // Make sure this is defined in your .env file
      { expiresIn: "1d" }
    );

    // 5. Send successful response
    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      token: token,
      data: {
        id: admin._id,
        email: admin.email,
        userName: admin.userName,
        fullname: admin.fullname,
        role: admin.role,
        isActive: admin.isActive // Optional: Send this back to the frontend
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;

    // 1. Find and delete the admin
    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    // 2. If the admin doesn't exist, return an error
    if (!deletedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // Optional: Prevent the currently logged-in user from deleting themselves
    // if (adminId === req.user.id) {
    //   return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    // }

    // 3. Send success response
    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting admin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const { timeframe } = req.query; // 'yesterday', '7days', or '30days'
    const { currentStart, currentEnd, prevStart, prevEnd } = getStatRanges(timeframe);

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    // Example: User Registrations
    const [currentUsers, prevUsers] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: currentStart, $lte: currentEnd } }),
      User.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd } })
    ]);

    // Example: Unique Participants (Aggregate)
    const getParts = async (start, end) => {
      const agg = await GameSession.aggregate([
        { $match: { status: "COMPLETED", completedAt: { $gte: start, $lte: end } } },
        { $group: { _id: "$userId" } },
        { $count: "count" }
      ]);
      return agg.length > 0 ? agg[0].count : 0;
    };

    const [currentParts, prevParts] = await Promise.all([
      getParts(currentStart, currentEnd),
      getParts(prevStart, prevEnd)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          value: currentUsers,
          trend: calculateGrowth(currentUsers, prevUsers)
        },
        participants: {
          value: currentParts,
          trend: calculateGrowth(currentParts, prevParts)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStatTrend = async (req, res) => {
  try {
    const { statType, timeframe } = req.query; // 'participants', 'users', 'replays'

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let currentStart, currentEnd, prevStart, prevEnd;

    // ==========================================
    // 1. CALCULATE DATE RANGES (Current vs Previous)
    // ==========================================
    if (timeframe === '7days') {
      currentStart = new Date(startOfToday);
      currentStart.setDate(currentStart.getDate() - 7);
      currentEnd = now;

      prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = currentStart;
    } else if (timeframe === '30days') {
      currentStart = new Date(startOfToday);
      currentStart.setDate(currentStart.getDate() - 30);
      currentEnd = now;

      prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 30);
      prevEnd = currentStart;
    } else {
      // Default: "Yesterday" dropdown option means comparing Today vs Yesterday
      currentStart = startOfToday;
      currentEnd = now;

      prevStart = new Date(startOfToday);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = startOfToday;
    }

    // ==========================================
    // 2. FETCH DATA MATCHING MAIN ANALYTICS LOGIC
    // ==========================================
    let currentCount = 0;
    let prevCount = 0;

    if (statType === 'users') {
      [currentCount, prevCount] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: currentStart, $lt: currentEnd } }),
        User.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd } })
      ]);
    }
    else if (statType === 'participants') {
      const getParticipantsCount = async (start, end) => {
        const query = { status: "COMPLETED", completedAt: { $gte: start, $lt: end } };
        const agg = await GameSession.aggregate([
          { $match: query },
          { $group: { _id: "$userId" } },
          { $count: "count" }
        ]);
        return agg.length > 0 ? agg[0].count : 0;
      };

      [currentCount, prevCount] = await Promise.all([
        getParticipantsCount(currentStart, currentEnd),
        getParticipantsCount(prevStart, prevEnd)
      ]);
    }
    else if (statType === 'replays') {
      const getReplaysCount = async (start, end) => {
        const query = { status: "COMPLETED", completedAt: { $gte: start, $lt: end } };

        // Match exact logic: Replays = Total Sessions - Unique Participants
        const totalSessions = await GameSession.countDocuments(query);

        const partsAgg = await GameSession.aggregate([
          { $match: query },
          { $group: { _id: "$userId" } },
          { $count: "count" }
        ]);
        const uniqueParticipants = partsAgg.length > 0 ? partsAgg[0].count : 0;

        return Math.max(0, totalSessions - uniqueParticipants);
      };

      [currentCount, prevCount] = await Promise.all([
        getReplaysCount(currentStart, currentEnd),
        getReplaysCount(prevStart, prevEnd)
      ]);
    }

    // ==========================================
    // 3. GROWTH CALCULATION
    // ==========================================
    const calculatePercentage = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const trend = calculatePercentage(currentCount, prevCount);

    return res.status(200).json({
      success: true,
      trend // Only returning the trend to match our frontend setup
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    const adminId = req.params.adminId;

    const admin = await Admin.findById(adminId).select("-password");

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        userName: admin.userName,
        email: admin.email,
        fullname: admin.fullname || "Admin", // Default if null,

      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.editAdminProfile = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const { fullName, userName, email, password } = req.body;

    // 1. Fetch the admin document
    let admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // 2. Update the fields directly on the document
    if (fullName) admin.fullname = fullName;
    if (userName) admin.userName = userName;
    if (email) admin.email = email;

    // 3. Check if the user typed a new password. If yes, hash it!
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    // 4. Save the document
    // This uses the modern MongoDB driver and automatically runs your schema validations
    await admin.save();

    // 5. Convert to a plain object and remove the password before sending to frontend
    const adminObj = admin.toObject();
    delete adminObj.password;

    // 6. Send the success response
    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      data: adminObj
    });

  } catch (error) {
    console.error("Error updating admin profile:", error);

    // Check for MongoDB Duplicate Key Error (e.g., email or username already taken)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `An admin with that ${field} already exists.`
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile due to an internal server error"
    });
  }
};



exports.toggleAdminStatus = async (req, res) => {
  try {
    const adminId = req.params.id;

    // 1. Find the admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Optional: Prevent users from disabling themselves so they don't get locked out!
    // if (adminId === req.user.id) {
    //   return res.status(400).json({ success: false, message: "You cannot disable your own account." });
    // }

    // 2. Flip the boolean value (if true make false, if false make true)
    admin.isActive = !admin.isActive;
    await admin.save();

    // 3. Send success response
    return res.status(200).json({
      success: true,
      message: `Admin ${admin.isActive ? 'enabled' : 'disabled'} successfully`,
      isActive: admin.isActive // send the new status back to frontend
    });

  } catch (error) {
    console.error("Error toggling admin status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};



exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: "No admin found with that email" });
    }

    // 2. Generate a secure 4-digit OTP
    const otp = crypto.randomInt(1000, 9999).toString();

    // 3. Save the OTP and Expiry (Valid for 10 minutes) to the DB
    admin.resetPasswordOtp = otp;
    admin.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;
    await admin.save();

    // 4. Send the email using your existing email utility function
    // Pass the email and the generated OTP to your custom function
    // await sendOtpEmail(admin.email, otp);


    // Generate the HTML template
    const emailHtml = `
  <div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2">
    <div style="margin: 50px auto; width: 70%; padding: 20px 0">
      <div style="border-bottom: 1px solid #eee">
        <a href="" style="font-size: 1.4em; color: #00466a; text-decoration: none; font-weight: 600">Kanoo Rental Game</a>
      </div>
      <p style="font-size: 1.1em">Hi,</p>
      <p>Use the following OTP to complete your password reset procedures. OTP is valid for 10 minutes.</p>
      <h2 style="background: #00466a; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otp}</h2>
      <p style="font-size: 0.9em;">Regards,<br />Kanoo Rental Game Team</p>
      <hr style="border: none; border-top: 1px solid #eee" />
      <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300">
        <p>Kanoo Rental Game Inc</p>
      </div>
    </div>
  </div>
`;

    // Call your Brevo utility
  if (process.env.EMAIL_PROVIDER === "BREVO") {
  // Send using Brevo
  await brevoSendMail({
    to: admin.email,
    subject: "Your Password Reset OTP",
    html: emailHtml
  });
} else {
  // Default to AWS SES
  await awsSendMail({
    to: admin.email,
    subject: "Your Password Reset OTP",
    html: emailHtml
  });
}
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email"
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);

    // Optional: If the email fails, clear the OTP from the DB so they can try again
    return res.status(500).json({ success: false, message: "Failed to send OTP email" });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    // 1. Get the required fields from the frontend request
    const { email, otp, newPassword } = req.body;

    // Basic validation
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required"
      });
    }

    // 2. Find the admin with that exact email and OTP
    // (Expiration check removed for now)
    const admin = await Admin.findOne({
      email: email,
      resetPasswordOtp: otp
    });

    // If no admin is found, the OTP or the email is wrong
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP   "
      });
    }

    // 3. Hash the new password securely
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);

    // 4. Clear the OTP fields from the database so this code cannot be reused
    admin.resetPasswordOtp = undefined;
    admin.resetPasswordOtpExpire = undefined;

    // 5. Save the new password
    await admin.save();

    // 6. Send success response back to React
    return res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now log in."
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while resetting the password"
    });
  }
};