const User = require("../models/UserModel");


exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // 2. Toggle the boolean status
    user.status = !user.status;

    // 3. Save to database
    await user.save();

    res.status(200).json({
      success: true,
      message: `User is now ${user.status ? 'Active' : 'Disabled'}`,
      status: user.status
    });

  } catch (error) {
    console.error("Toggle Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating status"
    });
  }
};
