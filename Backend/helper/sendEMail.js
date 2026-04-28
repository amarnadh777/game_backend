  const axios = require("axios");

  const sendOtpEmail = async (email, otp, firstName) => {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Kanoo Daily Rental Game",

          email: "kanooscargame@gmail.com" // must be verified in Brevo
        },
        to: [{ email }],
        subject: "Your OTP Code",
htmlContent: `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
  
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background:linear-gradient(90deg,#ff7a00,#ff3c00); padding:25px; text-align:center; color:white;">
      <h1 style="margin:0; font-size:24px;"> Kanoo Rental Game</h1>
      <p style="margin:5px 0 0; font-size:14px;">Drive Fast. Compete Hard. Win Big.</p>
    </div>

    <!-- Body -->
    <div style="padding:30px; text-align:center;">
      <h2 style="margin-bottom:10px;">Hi ${firstName} 👋</h2>

      <p style="font-size:16px; color:#555;">
        You're one step away from entering the race!
      </p>

      <p style="font-size:15px; color:#777;">
        Use the OTP below to continue your game:
      </p>

      <!-- OTP Box -->
      <div style="
        margin:25px auto;
        padding:15px 30px;
        display:inline-block;
        font-size:36px;
        font-weight:bold;
        letter-spacing:10px;
        background:#111;
        color:#fff;
        border-radius:10px;
      ">
        ${otp}
      </div>

      <p style="font-size:14px; color:#666; margin-top:20px;">
        Enter this code in the app to continue 
      </p>

      <p style="font-size:13px; color:#999; margin-top:15px;">
        If you didn’t request this, you can safely ignore this em
        ail.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9f9f9; padding:15px; text-align:center; font-size:12px; color:#999;">
      © ${new Date().getFullYear()} Kanoo Rental Game<br/>
      All rights reserved.
    </div>

  </div>

</div>
`
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
  };

  module.exports = sendOtpEmail;