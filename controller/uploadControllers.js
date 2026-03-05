const Banner = require("../models/bannerModel")

exports.uploadImage = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }



    const imageUrl =
      `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  const banner = new Banner({

    title: req.body.title,
    imageUrl: imageUrl,
    postion: req.body.position
  })
  banner.save()


    res.status(200).json({
      message: "Image uploaded successfully",
      url: imageUrl,
        postion: req.body.position
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};