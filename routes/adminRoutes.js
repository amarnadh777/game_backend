const router = require("express").Router();
const { analytics } = require("../controller/adminControllers");

router.get("/analytics", analytics);

module.exports = router;