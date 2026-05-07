const router = require('express').Router();
const bannerController = require("../controller/bannerController")
const authMiddleware = require("../middleware/authMiddleware");
const upload = require('../middleware/upload');

router.post("/upload", upload.any(), bannerController.uploadImage)
router.get("/list", bannerController.getBannerImages)
router.get("/admin-banners", bannerController.getAdminBanners)
router.delete("/delete/:id", bannerController.deleteBannerImage)
router.put("/update/:id", upload.any(), bannerController.updateImage)


router.patch("/toggle-status/:id", bannerController.toggleBannerStatus)
router.post("/clone/:id", bannerController.cloneBanner)


module.exports = router;