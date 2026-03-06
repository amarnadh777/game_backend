const router = require('express').Router();
const bannerController = require("../controller/bannerController")
const authMiddleware = require("../middleware/authMiddleware")

router.post("/upload",authMiddleware, bannerController.uploadImage)
router.get("/list", authMiddleware, bannerController.getBannerImages)


module.exports = router;