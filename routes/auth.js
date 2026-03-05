const routes = require('express').Router();
const authController = require("../controller/authController")

routes.post('/register', authController.register)
routes.post('/login', authController.login)


module.exports = routes;