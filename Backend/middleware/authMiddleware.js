const jwt = require("jsonwebtoken")
const User = require("../models/UserModel")
const authMiddleware = async (req, res, next) => {
try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if(!token){

        return res.status(401).json({ message: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    const user = await User.findById(decoded.userId).select("-password");
    req.user = user;
    next();
    
} catch (error) {
      return res.status(401).json({
      message: "Invalid or expired token"
    });
}
    
}
module.exports = authMiddleware;