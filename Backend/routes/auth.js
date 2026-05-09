const routes = require('express').Router();
const authController = require("../controller/authController")

routes.post('/register', authController.register)
routes.post('/login', authController.login)
routes.post('/admin-login', authController.adminLogin)
routes.post('/simple-register', authController.simpleRegister)
routes.post('/simple-login', authController.simpleLogin)
routes.post("/verify-otp",authController.verifyOtp)
routes.post("/resend-otp",authController.resendOtp)
routes.post("/simple-register",authController.simpleUserCreate)
// routes.post("/simple-login",authController.nameLogin)
// routes.post("/simple-login",authController.nameLogin)


 routes.post("/simple-login",authController.nameLogin)



module.exports = routes;










