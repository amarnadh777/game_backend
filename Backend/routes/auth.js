const routes = require('express').Router();
const authController = require("../controller/authController")

routes.post('/register', authController.register)
routes.post('/login', authController.login)
routes.post('/simple-register', authController.simpleRegister)
routes.post('/simple-login', authController.simpleLogin)
routes.post("/verify-otp",authController.verifyOtp)
routes.post("/resend-otp",authController.resendOtp)


module.exports = routes;










