const Banner = require("../models/bannerModel")
const path = require('path')
const fs = require('fs')


const getBaseUrl = (req) => {
  const protocol =
    req.headers["x-forwarded-proto"] || req.protocol;

  return `${protocol}://${req.get("host")}`;
};


// exports.uploadImage = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         message: "No file uploaded"
//       });
//     }

//     const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

//     // --- BACKGROUND SLNO CALCULATION ---
//     // 1. Find the banner with the highest slNo by sorting in descending order
//     const lastBanner = await Banner.findOne().sort({ slNo: -1 });

//     // 2. Determine the next slNo
//     // If a banner exists, add 1 to its slNo. If the database is empty, start at 1.
//     let nextSlNo = 1;
//     if (lastBanner && lastBanner.slNo) {
//       nextSlNo = Number(lastBanner.slNo) + 1;
//     }
//     // -----------------------------------


//     console.log(req.body)
//     const banner = new Banner({
//       slNo: nextSlNo,                // Use the calculated number here!
//       name: req.body.name,
//       imageUrl: imageUrl,
//       resolution: req.body.resolution,

//     });

//     await banner.save();

//     res.status(200).json({
//       message: "Image uploaded and saved successfully",
//       data: banner
//     });

//   } catch (error) {
//     console.error("Error uploading image:", error);
//     res.status(500).json({
//       message: error.message
//     });
//   }
// };
exports.uploadImage = async (req, res) => {
  try {
    const { name, resolution, isCarSpecific, bannerId } = req.body;

    // ==============================
    // ❌ check files
    // ==============================
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    // ==============================
    // SL NO LOGIC (unchanged)
    // ==============================
    const lastBanner = await Banner.findOne().sort({ slNo: -1 });

    let nextSlNo = 1;
    if (lastBanner && lastBanner.slNo) {
      nextSlNo = Number(lastBanner.slNo) + 1;
    }

    let bannerData = {
      slNo: nextSlNo,
      name,
      resolution,
      isCarSpecific: isCarSpecific === "true",
      bannerId
    };

    // =====================================================
    // ✅ CASE 1: CAR SPECIFIC (MULTIPLE IMAGES)
    // =====================================================
    // =====================================================
    // ✅ CASE 1: CAR SPECIFIC (MULTIPLE IMAGES)
    // =====================================================
    if (isCarSpecific === "true") {
      const carBanners = [];
      const cars = Array.isArray(req.body.cars) ? req.body.cars : [req.body.cars]; // ← fix if only 1 car

      req.files.forEach((file) => {
        const match = file.fieldname.match(/cars\[(\d+)\]/);

        if (match) {
          const index = parseInt(match[1]);
          // const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
          const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
          const carData = cars[index];
          console.log("carData:", carData); // ← check this

          carBanners.push({
            carId: String(carData?.carId),    // ← force string
            carName: String(carData?.carName),
            imageUrl
          });
        }
      });

      bannerData.carImages = carBanners;
    }

    // =====================================================
    // ✅ CASE 2: NORMAL (SINGLE IMAGE)
    // =====================================================
    else {
      // for normal banner → take first file
      const file = req.files[0];

      // const imageUrl =
      //   `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
      bannerData.imageUrl = imageUrl;
    }

    // ==============================
    // SAVE
    // ==============================
    const banner = new Banner(bannerData);
    await banner.save();

    res.status(200).json({
      message: "Image uploaded and saved successfully",
      data: banner
    });

  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({
      message: error.message
    });
  }
};


exports.getBannerImages = async (req, res) => {
  try {
    const { page = 1, search = "" } = req.query;

    const limit = 10;
    const skip = (page - 1) * limit;

    // --- CHANGED 'title' TO 'name' HERE ---
    const query = search
      ? { name: { $regex: search, $options: "i" } }
      : {};

    const banners = await Banner.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Banner.countDocuments(query);

    res.status(200).json({
      banners,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      total
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBannerImage = async (req, res) => {

  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        message: "Banner image not found"
      });
    }

    let imageName = null
    if (banner.imageUrl) {

      imageName = banner.imageUrl.split("/uploads/")[1];
    }

    if (imageName) {

      const imagePath = path.join(__dirname, "..", "uploads", imageName);

      if (fs.existsSync(imagePath)) {
        await fs.promises.unlink(imagePath)
        console.log("Image deleted", imagePath)


      }
      else {
        console.log("Image not found on server");
      }
    }
    const deletedBanner = await Banner.findByIdAndDelete(id);
    res.status(200).json({
      message: "Banner image deleted successfully",
      deletedBanner
    });

    if (!deletedBanner) {
      return res.status(404).json({
        message: "Banner image not found"
      });
    }
  } catch (error) {

    console.log(error)
    res.status(500).json({
      message: error.message
    });
  }
}





exports.updateImage = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        message: "Banner not found"
      });
    }

    // If new image uploaded
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      banner.imageUrl = imageUrl;
    }

    // Update fields if provided
    if (req.body.name) banner.name = req.body.name;
    if (req.body.resolution) banner.resolution = req.body.resolution;
    if (req.body.status) banner.status = req.body.status;

    await banner.save();

    res.status(200).json({
      message: "Banner updated successfully",
      data: banner
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};




exports.toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        message: "Banner not found"
      });
    }

    // toggle status
    banner.status = !banner.status;

    await banner.save();

    res.status(200).json({
      message: "Banner status updated successfully",
      banner
    });

  } catch (error) {
    console.error("Error toggling banner status:", error);
    res.status(500).json({
      message: error.message
    });
  }
};