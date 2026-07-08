const sendEmail = async (options) => {
  try {
    // Brevo HTTP API 
    if (process.env.BREVO_API_KEY) {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "TalkFlow",
            email: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER,
          },
          to: [{ email: options.email }],
          subject: options.subject,
          textContent: options.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Brevo API error:", errorData);
        throw new Error(errorData.message || "Brevo email failed");
      }

      const data = await response.json();
      console.log("Email sent via Brevo:", data.messageId);
      return data;
    }

    // Fallback: Log to console for local development
    console.log("=========================================");
    console.log(`[DEVELOPMENT MODE - SIMULATING EMAIL]`);
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    console.log("=========================================");
    console.log("WARNING: Set BREVO_API_KEY in .env to send real emails");

    return { messageId: "dev-simulated-id" };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
