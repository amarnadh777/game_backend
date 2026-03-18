
const userController = require("../controller/userController")  
const router = require("express").Router();
router.patch("/toggle-status/:id", userController.toggleUserStatus)
module.exports = router;