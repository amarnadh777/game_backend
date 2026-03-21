const User = require("../models/UserModel")
const jwt = require("jsonwebtoken")
const OTP = require("../models/otpModel")
const axios = require("axios")
const nodemailer = require('nodemailer')
const sendOtpEmail = require("../helper/sendEMail")
// exports.register = async (req, res) => {

//     try {
//         const {firstName, lastName, email, password, country, city, phoneNumber} = req.body;
//         if(!firstName || !email){
//             return res.status(400).json({message: "Please fill all required fields"})
//         }
//         const isEmailExist = await User.findOne({email})
//         if(isEmailExist){
//             return res.status(400).json({message: "Email already exists"})
//         }
//         const user = new User({
//             firstName,
//             lastName,
//             email,
//             password,
//             country,
//             city,
//             phoneNumber
//         })
//         await user.save()

//         res.status(201).json({message: "User registered successfully", user})

//     } catch (error) {
//         res.status(500).json({message: error.message})
//     }
// }


exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, country, city, phoneNumber } = req.body;

    if (!firstName || !email) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    let user = await User.findOne({ email });

    // 🔴 CASE 1: User exists
    if (user) {
      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // 🟡 CASE: Exists but NOT verified → update
      user.firstName = firstName;
      user.lastName = lastName;
      user.country = country;
      user.city = city;
      user.phoneNumber = phoneNumber;

      await user.save();

    } else {
      // 🟢 CASE 2: New user
      user = await User.create({
        firstName,
        lastName,
        email,
        country,
        city,
        phoneNumber,
        isEmailVerified: false
      });
    }

    // ✅ generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // ✅ update OR create OTP (important 🔥)
    await OTP.findOneAndUpdate(
      { email },
      {
        otp,
expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      },
      { upsert: true, returnDocument: "after" }
    );

    // ✅ nodemailer setup
//   const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false, // ✅ use false
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

//     // ✅ send email
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Verify Your Email",
//       html: `
//         <h2>Welcome ${firstName} 👋</h2>
//         <p>Your OTP is:</p>
//         <h1>${otp}</h1>
//         <p>This OTP is valid for 5 minutes.</p>
//       `
//     });


sendOtpEmail(email, otp, firstName);
   
    res.status(200).json({
      message: "OTP sent successfully",
      user
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};



exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // 🔍 find OTP
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found" });
    }

    // ⏰ check expiry
    // if (otpRecord.expiresAt < Date.now()) {
    //   return res.status(400).json({ message: "OTP expired" });
    // }

    // ❌ wrong OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ update user → verified
    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );

    // 🧹 delete OTP after success
    await OTP.deleteOne({ email });

    res.status(200).json({
      message: "Email verified successfully ✅",
      user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // 🔍 check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // 🔍 check existing OTP
    const existingOtp = await OTP.findOne({ email });

    if (existingOtp && existingOtp.updatedAt) {
      const cooldownPeriod = 60 * 1000; // 1 minute cooldown
      const timeSinceLastSent = Date.now() - new Date(existingOtp.updatedAt).getTime();
      
      if (timeSinceLastSent < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastSent) / 1000);
        return res.status(429).json({ message: `Please wait ${remainingSeconds} seconds before requesting another OTP` });
      }
    }


    

    // 🔥 generate new OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // 🔄 update OTP (no duplicate)
    await OTP.findOneAndUpdate(
      { email },
      {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
      },
      { upsert: true, new: true }
    );

    // 📧 send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Resend OTP",
      html: `
        <h2>Your new OTP</h2>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      `
    });

    console.log("Resent OTP:", otp);

    res.json({
      message: "OTP resent successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.login = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false,
                errorCode: "MISSING_FIELDS", // <--- Custom Code
                message: "Please fill all required fields" 
            });   
        }

        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ 
                success: false,
                errorCode: "INVALID_CREDENTIALS", // <--- Custom Code
                message: "Invalid email or password" 
            });
        }

        // 🚨 CHECK 1: Disabled by Admin
        if (user.status === false) {
            return res.status(403).json({ 
                success: false, 
                errorCode: "ACCOUNT_DISABLED", // <--- Unity will look for this!
                message: "Your account has been disabled by the administrator." 
            });
        }

        // 🚨 CHECK 2: Email Not Verified
        if (user.isEmailVerified === false) {
            return res.status(403).json({ 
                success: false, 
                errorCode: "EMAIL_NOT_VERIFIED", // <--- Unity will look for this!
                message: "Please verify your email address before logging in." 
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

        res.status(200).json({ 
            success: true,
            message: "User logged in successfully", 
            user,
            token: token
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ 
            success: false,
            errorCode: "SERVER_ERROR",
            message: error.message 
        });  
    }
};