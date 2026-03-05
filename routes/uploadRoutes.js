const express = require('express');
const router = express.Router();
const uploader = require("../middleware/upload")
const uploadController = require("../controller/uploadControllers")

router.post("/banner_image",uploader.single('image'), uploadController.uploadImage)
module.exports = router;