const GameSession = require("../models/gameSessionModel");
const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");

exports.analytics = async (req, res) => {
  try {
    // Calculate the date for 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ==========================================
    // DATE DEFINITIONS FOR "YESTERDAY" VS "TODAY"
    // ==========================================
    const now = new Date();
    // Start of Today (Midnight)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Start of Yesterday (Midnight yesterday)
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const weeklyGraphData = [
      { day: "Mon", participants: 0 },
      { day: "Tue", participants: 0 },
      { day: "Wed", participants: 0 },
      { day: "Thu", participants: 0 },
      { day: "Fri", participants: 0 },
      { day: "Sat", participants: 0 },
      { day: "Sun", participants: 0 },
    ];

    // Aggregate participants by day of the week
    const dailyParticipantsData = await GameSession.aggregate([
      {
        $match: {
          status: "COMPLETED",
          completedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: "$completedAt" }, 
            userId: "$userId",
          },
        },
      },
      {
        $group: {
          _id: "$_id.dayOfWeek",
          participantsCount: { $sum: 1 },
        },
      },
    ]);

    dailyParticipantsData.forEach((data) => {
      const mongoDay = data._id; 
      const arrayIndex = mongoDay === 1 ? 6 : mongoDay - 2;
      weeklyGraphData[arrayIndex].participants = data.participantsCount;
    });

    // 1. Total Registered Users
    const CountUser = await User.countDocuments();

    // 2. Total Unique Participants (Completed at least one game)
    const currentParticipantsData = await GameSession.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: "$userId" } },
      { $count: "total_participants" },
    ]);

    // 3. Replay Data (Users who played more than once)
    const replaydata = await GameSession.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: "$userId", totalPlays: { $sum: 1 } } },
      { $match: { totalPlays: { $gt: 1 } } },
      { $project: { replays: { $subtract: ["$totalPlays", 1] } } },
    ]);

    // 4. Most Used Vehicle
    const mostUsedVehicleData = await GameSession.aggregate([
      {
        $match: { status: "COMPLETED", vehicle: { $exists: true, $ne: null } },
      },
      { $group: { _id: "$vehicle", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const hourlyParticipantsData = await GameSession.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: { $hour: "$completedAt" }, 
          participantsCount: { $sum: 1 },
        },
      },
    ]);

    const timingGraphData = [
      { time: "8am", participants: 0 },
      { time: "10am", participants: 0 },
      { time: "12pm", participants: 0 },
      { time: "2pm", participants: 0 },
      { time: "4pm", participants: 0 },
      { time: "6pm", participants: 0 },
      { time: "8pm", participants: 0 },
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

    const vehicleCounts = await GameSession.aggregate([
      {
        $match: {
          status: "COMPLETED",
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

    const mostPlayedVehicles = [
      { name: "toyota_land_cruiser_gx_r_3_5l", count: 0 },
      { name: "lexus_lx_600_urban", count: 0 },
      { name: "icaur_v27_royal", count: 0 },
      { name: "deepal_g318", count: 0 },
      { name: "jetour_g700", count: 0 },
    ];

    vehicleCounts.forEach((item) => {
      const vehicle = mostPlayedVehicles.find((v) => v.name === item._id);
      if (vehicle) vehicle.count = item.count;
    });

    // ==========================================
    // DYNAMIC COUNTRY LIST
    // ==========================================
   // ==========================================
    // DYNAMIC COUNTRY LIST (FIXED FOR UNIQUE USERS)
    // ==========================================
    const countryCounts = await GameSession.aggregate([
      { $match: { status: "COMPLETED" } },
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
        // Check that country actually exists and isn't empty
        $match: {
          "user.country": { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        // Step 1: Group by User AND Country first to filter out duplicates. 
        // If one user played 100 times, this reduces them down to 1 record.
        $group: {
          _id: { 
            userId: "$userId", 
            country: "$user.country" 
          }
        }
      },
      {
        // Step 2: Now group strictly by the country and count those unique users!
        $group: {
          _id: "$_id.country",
          count: { $sum: 1 },
        },
      },
      {
        // Sort highest counts to the top
        $sort: { count: -1 } 
      }
    ]);

    // Map the database results dynamically to the frontend format
    const participantsByCountry = countryCounts.map((item) => ({
      country: item._id,
      count: item.count
    }));

    const totalParticipants = currentParticipantsData.length > 0 ? currentParticipantsData[0].total_participants : 0;
    const totalReplays = replaydata.reduce((acc, curr) => acc + curr.replays, 0);
    const mostUsedVehicle = mostUsedVehicleData.length > 0 ? mostUsedVehicleData[0]._id : null;


    // ==========================================
    // GROWTH CALCULATIONS (Today vs Yesterday)
    // ==========================================

    // Helper function to calculate percentage
    const calculatePercentage = (today, yesterday) => {
      if (yesterday === 0) return today > 0 ? 100 : 0; // If 0 yesterday but >0 today, that's 100% growth
      const percentage = ((today - yesterday) / yesterday) * 100;
      return Number(percentage.toFixed(1)); // Rounds to 1 decimal place (e.g., 10.5)
    };

    // --- 1. Registration Growth ---
    const usersToday = await User.countDocuments({ createdAt: { $gte: startOfToday } });
    const usersYesterday = await User.countDocuments({ createdAt: { $gte: startOfYesterday, $lt: startOfToday } });
    const registrationGrowth = calculatePercentage(usersToday, usersYesterday);

    // --- 2. Participant Growth ---
    // Participants Today
    const partsTodayAgg = await GameSession.aggregate([
      { $match: { status: "COMPLETED", completedAt: { $gte: startOfToday } } },
      { $group: { _id: "$userId" } },
      { $count: "count" }
    ]);
    const partsToday = partsTodayAgg.length > 0 ? partsTodayAgg[0].count : 0;

    // Participants Yesterday
    const partsYestAgg = await GameSession.aggregate([
      { $match: { status: "COMPLETED", completedAt: { $gte: startOfYesterday, $lt: startOfToday } } },
      { $group: { _id: "$userId" } },
      { $count: "count" }
    ]);
    const partsYesterday = partsYestAgg.length > 0 ? partsYestAgg[0].count : 0;
    
    const participantGrowth = calculatePercentage(partsToday, partsYesterday);

    // --- 3. Replay Growth ---
    // Replays = (Total Sessions) - (Unique Participants) for that time period
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
        totalParticipants: totalParticipants,
        totalReplays: totalReplays,
        mostUsedVehicle: mostUsedVehicle,
        
        // --- PERCENTAGE DATA ---
        registrationGrowth: registrationGrowth, 
        participantGrowth: participantGrowth,   
        replayGrowth: replayGrowth,             

        weeklyGraphData: weeklyGraphData,
        timingGraphData: timingGraphData,
        mostPlayedVehicles: mostPlayedVehicles,
        participantsByCountry: participantsByCountry, // Now 100% dynamic!
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

exports.creatAdmin = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // 1. Check if ALL fields are provided
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (email, password, and username)",
      });
    }

    // 2. Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email: email }, { userName: username }],
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
      userName: username,
    });

    await newAdmin.save();

    // 5. Send success response (Exclude the password from the returned data!)
    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        id: newAdmin._id,
        email: newAdmin.email,
        userName: newAdmin.userName
      },
    });

  } catch (error) {
    console.error("Create Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }}
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

    // 2. Find admin by email or userName (matching the field name in your create function)
    const admin = await Admin.findOne({
      $or: [{ email: email }, { userName: username }],
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 3. Compare the provided password with the hashed password in the database
    // (Assuming you have a pre-save hook in your mongoose model that hashes the password)
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
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};