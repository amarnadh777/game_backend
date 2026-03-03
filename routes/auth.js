const routes = require('express').Router();
const authController = require("../controller/authController")

routes.post('/register', authController.register)

module.exports = routes;