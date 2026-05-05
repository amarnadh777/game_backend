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
    },
    status:{
      type:Boolean,
      default:true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isEmailVerified: {
  type: Boolean,
  default: false
}

},
{
    timestamps: true 
})
module.exports = mongoose.model('User', userSchema)
