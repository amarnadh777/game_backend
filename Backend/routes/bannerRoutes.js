const router = require('express').Router();
const bannerController = require("../controller/bannerController")
const authMiddleware = require("../middleware/authMiddleware");
const upload = require('../middleware/upload');
const protectAdmin = require("../middleware/protectAdmin");
router.post("/upload", protectAdmin, upload.any(), bannerController.uploadImage)
router.get("/list", bannerController.getBannerImages)
router.get("/admin-banners", protectAdmin, bannerController.getAdminBanners)
router.delete("/delete/:id", protectAdmin, bannerController.deleteBannerImage)
router.put("/update/:id", protectAdmin, upload.any(), bannerController.updateImage)


router.patch("/toggle-status/:id", bannerController.toggleBannerStatus)
router.post("/clone/:id", bannerController.cloneBanner)


module.exports = router;