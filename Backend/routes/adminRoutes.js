const router = require("express").Router();
const { analytics ,creatAdmin,loginAdmin} = require("../controller/adminControllers");





router.get("/analytics", analytics);
router.post("/login", loginAdmin);
router.post("/create", creatAdmin);

module.exports = router;