const mongoose = require('mongoose')
const bannerSchema = new mongoose.Schema({
title:{
    type:String,
},
imageUrl:{
    type:String,
},
postion:{
    type:String,
}

})

module.exports = mongoose.model('Banner', bannerSchema)



