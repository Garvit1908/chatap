const nodemailer = require("nodemailer");
const dns = require("dns");

const sendEmail = async (options) => {
  try {
    let transporter;

    // Use environment variables if provided
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      // Manually resolve SMTP host to IPv4 — Render's IPv6 is broken
      let smtpHost = process.env.SMTP_HOST;
      try {
        const ipv4Addresses = await dns.promises.resolve4(smtpHost);
        if (ipv4Addresses.length > 0) {
          console.log(`Resolved ${smtpHost} to IPv4: ${ipv4Addresses[0]}`);
          smtpHost = ipv4Addresses[0];
        }
      } catch (dnsErr) {
        console.warn("IPv4 DNS resolution failed, using hostname:", dnsErr.message);
      }

      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: 465,
        secure: true,
        tls: {
          servername: process.env.SMTP_HOST, // Original hostname for TLS cert validation
          rejectUnauthorized: true,
        },
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
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

