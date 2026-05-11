const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// Initialize the SES client once
// Note: It automatically picks up AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from your .env file
const ses = new SESClient({ region: process.env.AWS_REGION || "eu-west-1" });

const awsSendMail = async ({ to, subject, html }) => {
  // Security check: ensure sender email exists
  const senderEmail = process.env.AWS_SES_SENDER || "noreply@game.kdrbahrain.com";
  
  if (!senderEmail) {
    console.error("Missing sender email configuration");
    throw new Error("Email configuration error");
  }

  try {
    const command = new SendEmailCommand({
      Source: senderEmail,
      Destination: { 
        ToAddresses: [to] 
      },
      Message: {
        Subject: { 
          Data: subject,
          Charset: "UTF-8"
        },
        Body: { 
          Html: { 
            Data: html,
            Charset: "UTF-8"
          } 
        },
      },
    });

    const response = await ses.send(command);
    return response;

  } catch (error) {
    // This part is crucial: AWS sends detailed metadata on failures
    console.error(`AWS SES Error [${error.name}]: ${error.message}`);

    // Log the full error metadata for debugging
    if (error.$metadata) {
      console.error("Full AWS Error Metadata:", JSON.stringify(error.$metadata));
    }

    throw new Error(`Failed to send email via AWS: ${error.message}`);
  }
};

module.exports = awsSendMail;