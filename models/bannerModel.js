// const mongoose = require('mongoose')
// const bannerSchema = new mongoose.Schema({
// title:{
//     type:String,
// },
// imageUrl:{
//     type:String,
// },
// postion:{
//     type:String,
// }

// })

// module.exports = mongoose.model('Banner', bannerSchema)



const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  slNo: {
    type: String, // Or Number, depending on your preference
  },
  name: {
    type: String, // e.g., "Race track billboard_1"
    required: true
  },
  imageUrl: {
    type: String, // The generated URL for the uploaded file
    required: true
  },
  resolution: {
    type: String, 
  },
  status: {
    type: Boolean,
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);