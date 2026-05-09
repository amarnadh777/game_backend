const axios = require("axios");

const brevoSendMail = async ({ to, subject, html }) => {
  // Security check: ensure API key exists
  if (!process.env.BREVO_API_KEY) {
    console.error("Missing BREVO_API_KEY in environment variables");
    throw new Error("Email configuration error");
  }

  try {
    const response = await axios({
      method: 'post',
      url: "https://api.brevo.com/v3/smtp/email",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json", // Added Accept header
      },
      data: {
        sender: {
          name: "Kanoo Rental Game",
          email: "kanooscargame@gmail.com", // MUST be verified in Brevo
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        htmlContent: html,
      },
    });

    return response.data;
  } catch (error) {
    // This part is crucial: Brevo sends detailed error messages here
    const errorMessage = error.response?.data?.message || error.message;
    const errorCode = error.response?.data?.code || "No Code";

    console.error(`Brevo Error [${errorCode}]: ${errorMessage}`);

    // Log the full error data for debugging
    if (error.response?.data) {
      console.error("Full Brevo Error Details:", JSON.stringify(error.response.data));
    }

    throw new Error(`Failed to send email: ${errorMessage}`);
  }
};

module.exports = brevoSendMail;