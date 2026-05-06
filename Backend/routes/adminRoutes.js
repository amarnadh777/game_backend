const router = require("express").Router();
const { analytics, creatAdmin, loginAdmin, getParticipantsGraphData, getTimingGraphData, getVehicleGraphData, getCountryGraphData, getDashboardStats, getStatTrend, getAdminProfile, editAdminProfile, forgotPassword



    , resetPassword
} = require("../controller/adminControllers");





router.get("/analytics", analytics);
router.post("/login", loginAdmin);
router.post("/create", creatAdmin);
router.get("/participants-chart", getParticipantsGraphData)
router.get("/timing-chart", getTimingGraphData)
router.get("/vehicles-chart", getVehicleGraphData)
router.get("/countries-chart", getCountryGraphData)
router.get("/dashboard-stats", getDashboardStats)
router.get("/stat-trend", getStatTrend)
router.get("/profile/:adminId", getAdminProfile);
router.put("/profile/edit/:adminId", editAdminProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;