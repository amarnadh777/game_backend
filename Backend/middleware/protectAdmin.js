const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");

const protectAdmin = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Disabled account check
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled by administrator",
        errorCode: "ACCOUNT_DISABLED",
      });
    }

    req.admin = admin;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = protectAdmin;