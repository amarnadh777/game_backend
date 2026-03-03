const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
 
    firstName:{
        type:String,
        required:true,
        trim:true
    },
    lastName:{

        type:String,
    },
    email:{
        type: String,
      required: true,
      lowercase: true,
    }
,
  password: {
      type: String,
    //   required: true,
    },
      country: {
      type: String,
    },
      city: {
      type: String,
    },
     phoneNumber: {
      type: String,
    }

},
{
    timestamps: true 
})
module.exports = mongoose.model('User', userSchema)