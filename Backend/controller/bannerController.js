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

    const existingBanner = await Banner.findOne({ bannerId });

    if (existingBanner) {
      return res.status(400).json({
        message: "Banner already exists for this placement. Please edit or delete the existing banner instead of creating a duplicate."
      });
    }

    // ==============================
    // SL NO LOGIC
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
    if (isCarSpecific === "true") {
      const carBanners = [];

      // Check if `req.body.cars` is populated by extended body parsing natively
      const cars = Array.isArray(req.body.cars) ? req.body.cars : [req.body.cars].filter(Boolean);

      if (cars.length > 0 && cars[0]) {
        console.log("🔍 USING NESTED REQ.BODY.CARS ARRAY");
        cars.forEach((carData, index) => {
          const carId = carData.carId;
          const carName = carData.carName;

          const file = req.files.find(f => {
            const m = f.fieldname.match(/cars\[(\d+)\]/);
            return m && m[1] === String(index);
          }) || req.files.find(f => f.fieldname === `cars[${index}][image]`);

          if (file) {
            const imageUrl = `${getBaseUrl(req)}/uploads/${file.filename}`;
            carBanners.push({ carId, carName, imageUrl });
          }
        });
      } else {
        console.log("🔍 USING FLAT REQ.BODY PARSING");
        // Fallback for flat parsing if middleware changes
        const carIndices = new Set();
        Object.keys(req.body).forEach(key => {
          const match = key.match(/cars\[(\d+)\]\[carId\]/);
          if (match) carIndices.add(match[1]);
        });

        carIndices.forEach(index => {
          const carId = req.body[`cars[${index}][carId]`];
          const carName = req.body[`cars[${index}][carName]`];

          const file = req.files.find(f => {
            const m = f.fieldname.match(/cars\[(\d+)\]/);
            return m && m[1] === String(index);
          }) || req.files.find(f => f.fieldname === `cars[${index}][image]`);

          if (file) {
            const imageUrl = `${getBaseUrl(req)}/uploads/${file.filename}`;
            carBanners.push({ carId, carName, imageUrl });
          }
        });
      }

      if (carBanners.length === 0) {
        return res.status(400).json({
          message: "No car images matched properly. Ensure you upload images for the selected cars."
        });
      }

      bannerData.carImages = carBanners;
    }
    // =====================================================
    // ✅ CASE 2: NORMAL (SINGLE IMAGE)
    // =====================================================
    else {
      const file = req.files[0];
      const imageUrl = `${getBaseUrl(req)}/uploads/${file.filename}`;
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

    const query = {
      status: true
    };

    // search filter
    if (search) {
      query.name = {
        $regex: search,
        $options: "i"
      };
    }

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

    res.status(500).json({
      message: error.message
    });

  }
};

exports.getAdminBanners = async (req, res) => {
  try {

    const {
      page = 1,
      search = "",
      status
    } = req.query;

    const limit = 10;
    const skip = (page - 1) * limit;

    const query = {};

    // 🔥 Search filter
    if (search) {
      query.name = {
        $regex: search,
        $options: "i"
      };
    }

    // 🔥 Status filter
    if (status !== undefined) {
      query.status = status === "true";
    }

    // 🔥 Get all banners first
    const banners = await Banner.find(query)
      .sort({ createdAt: -1 });

    // 🔥 Group by bannerId
    const grouped = {};

    banners.forEach((banner) => {

      if (!grouped[banner.bannerId]) {

        grouped[banner.bannerId] = {
          bannerId: banner.bannerId,
          variants: []
        };

      }

      grouped[banner.bannerId].variants.push(banner);

    });

    // 🔥 Convert object -> array
    const groupedArray = Object.values(grouped);

    // 🔥 Pagination after grouping
    const paginatedGroups = groupedArray.slice(
      skip,
      skip + limit
    );

    res.status(200).json({
      success: true,

      banners: paginatedGroups,

      page: Number(page),

      totalPages: Math.ceil(
        groupedArray.length / limit
      ),

      total: groupedArray.length

    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
// exports.deleteBannerImage = async (req, res) => {

//   try {
//     const { id } = req.params;
//     const banner = await Banner.findById(id);

//     if (!banner) {
//       return res.status(404).json({
//         message: "Banner image not found"
//       });
//     }

//     let imageName = null
//     if (banner.imageUrl) {

//       imageName = banner.imageUrl.split("/uploads/")[1];
//     }

//     if (imageName) {

//       const imagePath = path.join(__dirname, "..", "uploads", imageName);

//       if (fs.existsSync(imagePath)) {
//         await fs.promises.unlink(imagePath)
//         console.log("Image deleted", imagePath)


//       }
//       else {
//         console.log("Image not found on server");
//       }
//     }
//     const deletedBanner = await Banner.findByIdAndDelete(id);
//     res.status(200).json({
//       message: "Banner image deleted successfully",
//       deletedBanner
//     });

//     if (!deletedBanner) {
//       return res.status(404).json({
//         message: "Banner image not found"
//       });
//     }
//   } catch (error) {

//     console.log(error)
//     res.status(500).json({
//       message: error.message
//     });
//   }
// }





// exports.updateImage = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const banner = await Banner.findById(id);

//     if (!banner) {
//       return res.status(404).json({
//         message: "Banner not found"
//       });
//     }

//     // If new image uploaded
//     if (req.file) {
//       const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
//       banner.imageUrl = imageUrl;
//     }

//     // Update fields if provided
//     if (req.body.name) banner.name = req.body.name;
//     if (req.body.resolution) banner.resolution = req.body.resolution;
//     if (req.body.status) banner.status = req.body.status;

//     await banner.save();

//     res.status(200).json({
//       message: "Banner updated successfully",
//       data: banner
//     });

//   } catch (error) {
//     res.status(500).json({
//       message: error.message
//     });
//   }
// };
exports.deleteBannerImage = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("👉 DELETE REQUEST ID:", id);

    const banner = await Banner.findById(id);

    if (!banner) {
      console.log("❌ Banner not found in DB");
      return res.status(404).json({
        message: "Banner not found"
      });
    }

    console.log("✅ Banner found:", {
      name: banner.name,
      isCarSpecific: banner.isCarSpecific
    });

    // ==========================================
    // 🖼️ CASE 1: NORMAL IMAGE
    // ==========================================
    if (!banner.isCarSpecific && banner.imageUrl) {
      console.log("🖼️ Normal banner delete flow");

      const imageName = banner.imageUrl?.substring(
        banner.imageUrl.lastIndexOf("/") + 1
      );

      console.log("📁 Extracted filename:", imageName);

      const imagePath = path.join(__dirname, "..", "uploads", imageName);

      console.log("📂 Full path:", imagePath);

      try {
        if (fs.existsSync(imagePath)) {
          await fs.promises.unlink(imagePath);
          console.log("✅ Deleted normal banner image");
        } else {
          console.log("⚠️ File not found on server");
        }
      } catch (err) {
        console.log("❌ Error deleting normal image:", err);
      }
    }

    // ==========================================
    // 🚗 CASE 2: CAR-SPECIFIC IMAGES
    // ==========================================
    if (banner.isCarSpecific) {
      console.log("🚗 Car-specific delete flow");

      console.log("📦 Car images:", banner.carImages);

      if (!banner.carImages || banner.carImages.length === 0) {
        console.log("⚠️ No car images found");
      }

      for (const car of banner.carImages) {
        if (!car.imageUrl) {
          console.log(`⚠️ Missing imageUrl for car: ${car.carName}`);
          continue;
        }

        const imageName = car.imageUrl?.substring(
          car.imageUrl.lastIndexOf("/") + 1
        );

        console.log(`🚗 Processing car: ${car.carName}`);
        console.log("📁 Extracted filename:", imageName);

        const imagePath = path.join(__dirname, "..", "uploads", imageName);

        console.log("📂 Full path:", imagePath);

        try {
          if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath);
            console.log(`✅ Deleted image for ${car.carName}`);
          } else {
            console.log(`⚠️ File NOT found for ${car.carName}`);
          }
        } catch (err) {
          console.log(`❌ Error deleting image for ${car.carName}:`, err);
        }
      }
    }

    // ==========================================
    // 🗑️ DELETE DB RECORD
    // ==========================================
    const deletedBanner = await Banner.findByIdAndDelete(id);

    console.log("🗑️ DB record deleted");

    return res.status(200).json({
      message: "Banner deleted successfully",
      deletedBanner
    });

  } catch (error) {
    console.error("🔥 DELETE ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};
exports.updateImage = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        message: "Banner not found"
      });
    }

    // ✅ Update basic fields
    if (req.body.name) banner.name = req.body.name;
    if (req.body.bannerId) banner.bannerId = req.body.bannerId;
    if (req.body.status !== undefined) banner.status = req.body.status === 'true';

    // ==========================================
    // 🚗 CASE 1: CAR SPECIFIC UPDATE
    // ==========================================
    if (req.body.isCarSpecific === 'true' || req.body.isCarSpecific === true) {
      banner.isCarSpecific = true;

      const carImages = [];
      const files = req.files || [];

      // Check if `req.body.cars` is populated by extended body parsing natively
      const parsedCars = Array.isArray(req.body.cars) ? req.body.cars : [req.body.cars].filter(Boolean);

      if (parsedCars.length > 0 && parsedCars[0]) {
        parsedCars.forEach((carData, index) => {
          const carId = carData.carId;
          const carName = carData.carName;

          const file = files.find(f => {
            const m = f.fieldname.match(/cars\[(\d+)\]/);
            return m && m[1] === String(index);
          }) || files.find(f => f.fieldname === `cars[${index}][image]`);

          // Preserve existing imageUrl if available
          let imageUrl = null;
          const existingCar = banner.carImages && banner.carImages.find(c => c.carId === carId);
          if (existingCar) {
            imageUrl = existingCar.imageUrl;
          }

          if (file) {
            imageUrl = `${getBaseUrl(req)}/uploads/${file.filename}`;
          }

          carImages.push({ carId, carName, imageUrl });
        });
      } else {
        // Fallback for flat parsing
        const carIndices = new Set();
        Object.keys(req.body).forEach(key => {
          const match = key.match(/cars\[(\d+)\]\[carId\]/);
          if (match) carIndices.add(match[1]);
        });

        carIndices.forEach(index => {
          const carId = req.body[`cars[${index}][carId]`];
          const carName = req.body[`cars[${index}][carName]`];

          const file = files.find(f => {
            const m = f.fieldname.match(/cars\[(\d+)\]/);
            return m && m[1] === String(index);
          }) || files.find(f => f.fieldname === `cars[${index}][image]`);

          // Preserve existing imageUrl if available
          let imageUrl = null;
          const existingCar = banner.carImages && banner.carImages.find(c => c.carId === carId);
          if (existingCar) {
            imageUrl = existingCar.imageUrl;
          }

          if (file) {
            imageUrl = `${getBaseUrl(req)}/uploads/${file.filename}`;
          }

          carImages.push({ carId, carName, imageUrl });
        });
      }

      banner.carImages = carImages;
      banner.imageUrl = ""; // clear normal image
    }

    // ==========================================
    // 🖼️ CASE 2: NORMAL BANNER UPDATE
    // ==========================================
    else {
      banner.isCarSpecific = false;

      if (req.files && req.files.length > 0) {
        const file = req.files.find(f => f.fieldname === "files");

        if (file) {
          banner.imageUrl = `${getBaseUrl(req)}/uploads/${file.filename}`;
        }
      }

      banner.carImages = []; // clear car-specific
    }

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

    // selected banner
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    // 🔥 if enabling banner
    if (!banner.status) {

      // disable all variants 
      await Banner.updateMany(
        {
          bannerId: banner.bannerId
        },
        {
          $set: {
            status: false
          }
        }
      );

      // enable selected banner
      banner.status = true;

    } else {

      // disable current banner
      banner.status = false;

    }

    await banner.save();

    res.status(200).json({
      success: true,
      message: "Banner status updated",
      banner
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.cloneBanner = async (req, res) => {
  try {
    const { id } = req.params;

    // Extract the custom name sent from the frontend
    const { name: customName } = req.body;

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    const clonedBanner = new Banner({
      slNo: banner.slNo,

      // same group
      bannerId: banner.bannerId,

      // Use the custom name from the frontend if provided, otherwise default to "Copy"
      name: customName ? customName : `${banner.name} Copy`,

      clonedFrom: banner._id,

      imageUrl: banner.imageUrl,

      isCarSpecific: banner.isCarSpecific,

      carImages: banner.carImages,

      resolution: banner.resolution,

      // inactive by default
      status: false
    });

    await clonedBanner.save();

    res.status(201).json({
      success: true,
      message: "Banner cloned successfully",
      data: clonedBanner
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};