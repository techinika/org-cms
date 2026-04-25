import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toEmail, subject, message, applicantName, opportunityTitle } = body;

    if (!toEmail || !subject || !message) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #3182ce, #63b3ed); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${opportunityTitle || "Application Update"}</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <div style="white-space: pre-wrap; color: #2d3748; margin: 20px 0;">
            ${message}
          </div>
          <p style="color: #718096; font-size: 14px; margin-top: 30px;">
            Best regards,<br/>
            ${opportunityTitle || "The Team"}
          </p>
        </div>
        <div style="text-align: center; padding: 15px; background: #f7fafc; font-size: 12px; color: #a0aec0;">
          This is an automated message. Please do not reply directly to this email.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: `[${opportunityTitle}] ${subject}`,
      html: htmlContent,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return Response.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}