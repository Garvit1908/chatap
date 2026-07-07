const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    let transporter;

    // Use environment variables if provided
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', 
        family: 4, // Force IPv4 to bypass Render's IPv6 issue
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Fallback: Just log it to the console for local development
      console.log("=========================================");
      console.log(`[DEVELOPMENT MODE - SIMULATING EMAIL]`);
      console.log(`To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Message: ${options.message}`);
      console.log("=========================================");
      console.log("WARNING: To send real emails, please configure SMTP variables in .env");
      
      // Simulate success
      return { messageId: "dev-simulated-id" };
    }

    const message = {
      from: process.env.SMTP_FROM || '"TalkFlow Admin" <noreply@talkflow.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    const info = await transporter.sendMail(message);

    console.log("Message sent: %s", info.messageId);
    
    // Preview only available when sending through an Ethereal account
    if (!process.env.SMTP_HOST) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
