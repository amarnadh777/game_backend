
const GameSession = require("../models/gameSessionModel");
const User = require("../models/UserModel");
exports.analytics = async (req, res) => {
    try {

      const CountUser = await User.countDocuments();  
     const currentParticipantsData = await GameSession.aggregate([
    {$match :{status:"COMPLETED"}},
    {$group :{_id:"$userId"}},
    { $count: "total_participants" }
    
     ])


     const replaydata = await GameSession.aggregate([
  { $match: { status: "COMPLETED" } },
  { $group: { _id: "$userId", totalPlays: { $sum: 1 } } },
  { $match: { totalPlays: { $gt: 1 } } },
  { $project: { replays: { $subtract: ["$totalPlays", 1] } } },

]);

console.log("replaydata",replaydata)
console.log(currentParticipantsData)
return res.status(200).json({
    success: true,
    message: "Analytics data fetched successfully",
    data: currentParticipantsData,
    totalUser:CountUser
})

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}