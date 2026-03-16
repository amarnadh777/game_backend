const Banner = require("../models/bannerModel")

// exports.uploadImage = async (req, res) => {
//   try {

//     if (!req.file) {
//       return res.status(400).json({
//         message: "No file uploaded"
//       });
//     }



//     const imageUrl =
//       `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

//   const banner = new Banner({

//     title: req.body.title,
//     imageUrl: imageUrl,
//     postion: req.body.position
//   })
//   banner.save()


//     res.status(200).json({
//       message: "Image uploaded successfully",
//       url: imageUrl,
//         postion: req.body.position
//     });

//   } catch (error) {

//     res.status(500).json({
//       message: error.message
//     });

//   }
// };



exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    // --- BACKGROUND SLNO CALCULATION ---
    // 1. Find the banner with the highest slNo by sorting in descending order
    const lastBanner = await Banner.findOne().sort({ slNo: -1 });
    
    // 2. Determine the next slNo
    // If a banner exists, add 1 to its slNo. If the database is empty, start at 1.
    let nextSlNo = 1; 
    if (lastBanner && lastBanner.slNo) {
      nextSlNo = Number(lastBanner.slNo) + 1;
    }
    // -----------------------------------

    const banner = new Banner({
      slNo: nextSlNo,                // Use the calculated number here!
      name: req.body.name,           
      imageUrl: imageUrl,
      resolution: req.body.resolution, 
      status: req.body.status
    });

    await banner.save();

    res.status(200).json({
      message: "Image uploaded and saved successfully",
      data: banner 
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
exports.getBannerImages = async (req, res) => {

try {
const banners = await Banner.find().sort({ createdAt: -1 });
res.status(200).json({
  message: "Banner images retrieved successfully",
  banners
})

    
} catch (error) {
    console.log("Error retrieving banner images:", error);
    res.status(500).json({
      message: error.message
    });
}



}


exports.deleteBannerImage = async (req, res) => {

  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        message: "Banner image not found"
      });
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