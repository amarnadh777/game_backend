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



// exports.register = async (req, res) => {
//   try {
//     const { firstName, lastName, email, country, city, phoneNumber } = req.body;

//     // ✅ Validation
//     if (!firstName || !email) {
//       return res.status(400).json({
//         success: false,
//         message: "First name and email are required",
//         errorCode: "VALIDATION_ERROR"
//       });
//     }

//     let user = await User.findOne({ email });

//     // 🔴 CASE 1: User exists
//     if (user) {
//       if (user.isEmailVerified) {
//         return res.status(400).json({
//           success: false,
//           message: "Email already exists",
//           errorCode: "EMAIL_ALREADY_EXISTS"
//         });
//       }

//       // 🟡 Update unverified user
//       user.firstName = firstName;
//       user.lastName = lastName;
//       user.country = country;
//       user.city = city;
//       user.phoneNumber = phoneNumber;

//       await user.save();

//     } else {
//       // 🟢 New user
//       user = await User.create({
//         firstName,
//         lastName,
//         email,
//         country,
//         city,
//         phoneNumber,
//         isEmailVerified: false
//       });
//     }

//     // ✅ Generate OTP
//     const otp = Math.floor(1000 + Math.random() * 9000);

//     // ✅ Save OTP
//     await OTP.findOneAndUpdate(
//       { email },
//       {
//         otp,
//         expiresAt: new Date(Date.now() + 5 * 60 * 1000)
//       },
//       {
//         upsert: true,
//         new: true
//       }
//     );

//     // ✅ Send Email
//     await sendOtpEmail(email, otp, firstName);

//     // ✅ Success Response
//     return res.status(200).json({
//       success: true,
//       message: "OTP sent successfully",
//       data: {
//         user: {
//           _id: user._id,
//           email: user.email,
//           isEmailVerified: user.isEmailVerified
//         }
//       }
//     });

//   } catch (error) {
//     console.error("Register Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       errorCode: "SERVER_ERROR"
//     });
//   }
// };




// 🔥 Whitelist emails
const WHITELIST_EMAILS = [
  "sravan@ortmoragency.com",
  "test2@gmail.com",
  "qa@yourapp.com",
  "amarnadh6565@gmail.com"
].map((e) => e.toLowerCase().trim());

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, country, city, phoneNumber } = req.body;

    // ✅ Validation
    if (!firstName || !email) {
      return res.status(400).json({
        success: false,
        message: "First name and email are required",
        errorCode: "VALIDATION_ERROR",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 🔍 Check whitelist
    const isWhitelisted = WHITELIST_EMAILS.includes(normalizedEmail);

    let user = await User.findOne({ email: normalizedEmail });

    // 🔴 CASE 1: User exists
    if (user) {
      // ❌ Block only if NOT whitelisted
      if (user.isEmailVerified && !isWhitelisted) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
          errorCode: "EMAIL_ALREADY_EXISTS",
        });
      }

      // 🟡 Update user (even if verified IF whitelisted)
      user.firstName = firstName;
      user.lastName = lastName;
      user.country = country;
      user.city = city;
      user.phoneNumber = phoneNumber;

      // 🔥 Optional: reset verification for test users
      if (isWhitelisted) {
        user.isEmailVerified = false;
      }

      await user.save();
    } else {
      // 🟢 New user
      user = await User.create({
        firstName,
        lastName,
        email: normalizedEmail,
        country,
        city,
        phoneNumber,
        isEmailVerified: false,
      });
    }

    // ✅ Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // ✅ Save OTP
    await OTP.findOneAndUpdate(
      { email: normalizedEmail },
      {
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      {
        upsert: true,
        new: true,
      }
    );

    // ✅ Send Email
    await sendOtpEmail(normalizedEmail, otp, firstName);

    // ✅ Response
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          isTestUser: isWhitelisted, // 👈 helpful flag
        },
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
};

exports.simpleUserCreate = async (req, res) => {
  try {
    const { firstName, lastName, email, country, city, phoneNumber } = req.body;

    // ✅ Required fields
    if (!firstName || !lastName || !country) {
      return res.status(400).json({
        success: false,
        message: "First name, last name and country are required",
      });
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    // 🔥 Check existing by name + country
    let user = await User.findOne({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      country: country.trim(),
    });

    if (user) {
      // ✅ OPTIONAL: update details
      user.city = city || user.city;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      if (normalizedEmail) user.email = normalizedEmail;

      await user.save();
    } else {
      // 🆕 Create new user
      user = await User.create({
        firstName,
        lastName,
        email: normalizedEmail,
        country,
        city,
        phoneNumber,
      });
    }

    // 🔐 Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "SECRET_KEY"
    );

    return res.status(200).json({
      success: true,
      message: user ? "Login successful" : "User created",
      token,
      data: { user },
    });

  } catch (error) {
    console.error("Simple User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.nameLogin = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    // ✅ Validation
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
      });
    }

    // 🔍 Find user
    const user = await User.findOne({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔐 Generate token
    const token = jwt.sign(
      { userId: user._id},
      process.env.JWT_SECRET || "SECRET_KEY",
    );

    // ✅ Response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        user,
      },
    });

  } catch (error) {
    console.error("Name Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // ✅ Validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
        errorCode: "VALIDATION_ERROR"
      });
    }

    // 🔍 Find OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
        errorCode: "OTP_NOT_FOUND"
      });
    }

    // ❌ Compare OTP (safe compare)
    if (String(otpRecord.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        errorCode: "INVALID_OTP"
      });
    }

    // 🔍 Check user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errorCode: "USER_NOT_FOUND"
      });
    }

    // ✅ Update user → verified
    user.isEmailVerified = true;
    await user.save();

    // 🧹 Delete OTP after success
    await OTP.deleteOne({ email });

    // 🔑 Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    // ✅ Success response
    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          isEmailVerified: user.isEmailVerified
        }
      },
      token: token
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
};



exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // ✅ Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        errorCode: "VALIDATION_ERROR"
      });
    }

    // 🔍 Check user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errorCode: "USER_NOT_FOUND"
      });
    }

    // ❌ Already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
        errorCode: "EMAIL_ALREADY_VERIFIED"
      });
    }

    // 🔍 Check cooldown
    const existingOtp = await OTP.findOne({ email });

    if (existingOtp && existingOtp.updatedAt) {
      const cooldownPeriod = 60 * 1000; // 1 min
      const timeSinceLastSent =
        Date.now() - new Date(existingOtp.updatedAt).getTime();

      if (timeSinceLastSent < cooldownPeriod) {
        const remainingSeconds = Math.ceil(
          (cooldownPeriod - timeSinceLastSent) / 1000
        );

        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
          errorCode: "OTP_COOLDOWN"
        });
      }
    }

    // 🔥 Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // 🔄 Update or create OTP
    await OTP.findOneAndUpdate(
      { email },
      { otp },
      { upsert: true, new: true }
    );

    // 📧 Send email
    await sendOtpEmail(email, otp, user.firstName);

    console.log("Resent OTP:", otp);

    // ✅ Response
    return res.status(200).json({
      success: true,
      message: "OTP resent successfully"
    });

  } catch (error) {
    console.error("Resend OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
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
                message: "Invalid email" 
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

        // (Password check would go here, returning "INVALID_CREDENTIALS" if it fails)

        // Success!
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