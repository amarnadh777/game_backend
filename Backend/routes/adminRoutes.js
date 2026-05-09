const router = require("express").Router();

const {
  analytics,
  creatAdmin,
  loginAdmin,
  getParticipantsGraphData,
  getTimingGraphData,
  getVehicleGraphData,
  getCountryGraphData,
  getDashboardStats,
  getStatTrend,
  getAdminProfile,
  editAdminProfile,
  forgotPassword,
  resetPassword,
  getStatsCardsData,
  getAllAdminList,
  toggleAdminStatus,
  deleteAdmin,
  createAdminWithTempPassword
} = require("../controller/adminControllers");

const protectAdmin = require("../middleware/protectAdmin");


// ==========================================
// PUBLIC ROUTES
// ==========================================

router.post("/login", loginAdmin);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);


// ==========================================
// PROTECTED ROUTES
// ==========================================

router.use(protectAdmin);


// Dashboard
router.get("/analytics", analytics);

router.get("/dashboard-stats", getDashboardStats);

router.get("/stat-trend", getStatTrend);

router.get("/stats-cards", getStatsCardsData);


// Charts
router.get("/participants-chart", getParticipantsGraphData);

router.get("/timing-chart", getTimingGraphData);

router.get("/vehicles-chart", getVehicleGraphData);

router.get("/countries-chart", getCountryGraphData);


// Admin Management
router.post("/create", creatAdmin);

router.post(
  "/create-with-temp-password",
  createAdminWithTempPassword
);

router.get("/list", getAllAdminList);

router.patch("/toggle-status/:id", toggleAdminStatus);

router.delete("/delete/:id", deleteAdmin);


// Profile
router.get("/profile/:adminId", getAdminProfile);

router.put("/profile/edit/:adminId", editAdminProfile);


module.exports = router;