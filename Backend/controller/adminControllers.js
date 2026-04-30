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
      // 1. Only get completed games from the last 7 days
      {
        $match: {
          status: "COMPLETED",
          completedAt: { $gte: sevenDaysAgo },
        },
      },
      // 2. Group by the Day of the Week AND User ID to get unique participants per day
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: "$completedAt" }, // Returns 1 (Sun) to 7 (Sat)
            userId: "$userId",
          },
        },
      },
      // 3. Group again by just the Day of the Week and count the unique users
      {
        $group: {
          _id: "$_id.dayOfWeek",
          participantsCount: { $sum: 1 },
        },
      },
    ]);

    // --- Format for the Frontend ---
    // We want an array matching: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]

    dailyParticipantsData.forEach((data) => {
      const mongoDay = data._id; // 1 = Sun, 2 = Mon, 3 = Tue...

      // Convert MongoDB's 1-7 (Sun-Sat) to our array index 0-6 (Mon-Sun)
      const arrayIndex = mongoDay === 1 ? 6 : mongoDay - 2;

      // Update the 'participants' count inside the specific day's object
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
      // Only count vehicles from completed sessions (and ensure vehicle exists)
      {
        $match: { status: "COMPLETED", vehicle: { $exists: true, $ne: null } },
      },
      // Group by the vehicle name and count occurrences
      { $group: { _id: "$vehicle", count: { $sum: 1 } } },
      // Sort by the count in descending order (highest first)
      { $sort: { count: -1 } },
      // Keep only the top result
      { $limit: 1 },
    ]);

    const hourlyParticipantsData = await GameSession.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: { $hour: "$completedAt" }, // Extracts the hour (0 to 23)
          participantsCount: { $sum: 1 },
        },
      },
    ]);

    // 2. Pre-fill our array with the specific 2-hour time buckets
    const timingGraphData = [
      { time: "8am", participants: 0 },
      { time: "10am", participants: 0 },
      { time: "12pm", participants: 0 },
      { time: "2pm", participants: 0 },
      { time: "4pm", participants: 0 },
      { time: "6pm", participants: 0 },
      { time: "8pm", participants: 0 },
    ];

    // 3. Map the 24-hour format into your specific buckets
    hourlyParticipantsData.forEach((data) => {
      const hour = data._id; // This will be a number from 0 to 23
      const count = data.participantsCount;

      // We group them into 2-hour windows
      if (hour >= 8 && hour < 10) {
        timingGraphData[0].participants += count; // 8:00 AM - 9:59 AM
      } else if (hour >= 10 && hour < 12) {
        timingGraphData[1].participants += count; // 10:00 AM - 11:59 AM
      } else if (hour >= 12 && hour < 14) {
        timingGraphData[2].participants += count; // 12:00 PM - 1:59 PM
      } else if (hour >= 14 && hour < 16) {
        timingGraphData[3].participants += count; // 2:00 PM - 3:59 PM
      } else if (hour >= 16 && hour < 18) {
        timingGraphData[4].participants += count; // 4:00 PM - 5:59 PM
      } else if (hour >= 18 && hour < 20) {
        timingGraphData[5].participants += count; // 6:00 PM - 7:59 PM
      } else if (hour >= 20 && hour < 22) {
        timingGraphData[6].participants += count; // 8:00 PM - 9:59 PM
      }
      // Note: Hours from 10pm to 7am are ignored in this specific chart based on your labels.
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

    // 2. Prepare the final array with your specific vehicle codes
    const mostPlayedVehicles = [
      { name: "toyota_land_cruiser_gx_r_3_5l", count: 0 },
      { name: "lexus_lx_600_urban", count: 0 },
      { name: "icaur_v27_royal", count: 0 },
      { name: "deepal_g318", count: 0 },
      { name: "jetour_g700", count: 0 },
    ];

    // 3. Map the database results to our pre-defined list
    vehicleCounts.forEach((item) => {
      const vehicle = mostPlayedVehicles.find((v) => v.name === item._id);
      if (vehicle) {
        vehicle.count = item.count;
      }
    });

    // --- Participants By Country Stats ---

    // 1. Join GameSession with User to get the country, then group and count
    const countryCounts = await GameSession.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        // This acts like a SQL "JOIN" to grab the user's data
        $lookup: {
          from: "users", // Make sure this matches your actual MongoDB collection name for users (usually lowercase plural)
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" }, // Flattens the array created by $lookup
      {
        // Filter only for the specific countries you want
        $match: {
          "user.country": {
            $in: [
              "UAE",
              "Ireland",
              "India",
              "Switzerland",
              "USA",
              "Germany",
              "Japan",
              "South Korea",
              "France",
              "Brazil",
            ],
          },
        },
      },
      {
        // Group by the country name and count
        $group: {
          _id: "$user.country",
          count: { $sum: 1 },
        },
      },
    ]);

    // 2. Prepare the final array with your specific countries
    const participantsByCountry = [
      { country: "UAE", count: 0 },
      { country: "Ireland", count: 0 },
      { country: "India", count: 0 },
      { country: "Switzerland", count: 0 },
      { country: "USA", count: 0 },
      { country: "Germany", count: 0 },
      { country: "Japan", count: 0 },
      { country: "South Korea", count: 0 },
      { country: "France", count: 0 },
      { country: "Brazil", count: 0 },
    ];

    // 3. Map the database results to our pre-defined list
    countryCounts.forEach((item) => {
      const countryData = participantsByCountry.find(
        (c) => c.country === item._id,
      );
      if (countryData) {
        countryData.count = item.count;
      }
    });
    // --- Format the extracted data for a cleaner JSON response ---

    // Extract the number from the array, default to 0 if empty
    const totalParticipants =
      currentParticipantsData.length > 0
        ? currentParticipantsData[0].total_participants
        : 0;

    // Calculate the total number of replays across all users
    const totalReplays = replaydata.reduce(
      (acc, curr) => acc + curr.replays,
      0,
    );

    // Extract the vehicle name, default to null if no games have been played
    const mostUsedVehicle =
      mostUsedVehicleData.length > 0 ? mostUsedVehicleData[0]._id : null;

    return res.status(200).json({
      success: true,
      message: "Analytics data fetched successfully",
      data: {
        totalUsers: CountUser,
        totalParticipants: totalParticipants,
        totalReplays: totalReplays,
        mostUsedVehicle: mostUsedVehicle,
        weeklyGraphData: weeklyGraphData,
        timingGraphData: timingGraphData,
        mostPlayedVehicles: mostPlayedVehicles,
        participantsByCountry: participantsByCountry,
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