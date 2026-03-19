const axios = require("axios");

const sendOtpEmail = async (email, otp, firstName) => {
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "Kanoo Daily Rental Game",

        email: "amarnadh6565@gmail.com" // must be verified in Brevo
      },
      to: [{ email }],
      subject: "Your OTP Code",
      htmlContent: `
        <h2>Hello ${firstName} 👋</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
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