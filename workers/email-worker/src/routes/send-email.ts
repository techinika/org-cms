import { Env } from "../env";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function verifyAuth(request: Request, env: Env): Promise<boolean> {
  const apiKey = request.headers.get("X-API-Key");
  if (apiKey && apiKey === env.WORKER_API_KEY) return true;

  const cookieHeader = request.headers.get("Cookie") || "";
  const authHeader = request.headers.get("Authorization") || "";
  try {
    const res = await fetch(`${env.AUTH_URL}/api/auth/status`, {
      method: "GET",
      headers: { Cookie: cookieHeader, Authorization: authHeader },
    });
    if (res.ok) {
      const data = await res.json() as { authenticated?: boolean };
      return data.authenticated === true;
    }
  } catch {}
  return false;
}

export async function handleSendEmail(
  request: Request,
  env: Env,
  origin: string | null
): Promise<Response> {
  const jsonResp = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Credentials": "true",
      },
    });

  if (!(await verifyAuth(request, env))) {
    return jsonResp({ error: "Unauthorized" }, 401);
  }

  try {
    const body = (await request.json()) as {
      toEmail?: string;
      subject?: string;
      message?: string;
      applicantName?: string;
      opportunityTitle?: string;
    };

    const { toEmail, subject, message, applicantName, opportunityTitle } = body;

    if (!toEmail || !subject || !message) {
      return jsonResp({ error: "Missing required fields" }, 400);
    }

    const safeTitle = escapeHtml(opportunityTitle || "Application Update");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");
    const safeFrom = escapeHtml(opportunityTitle || "The Team");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #3182ce, #63b3ed); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${safeTitle}</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <div style="color: #2d3748; margin: 20px 0;">
            ${safeMessage}
          </div>
          <p style="color: #718096; font-size: 14px; margin-top: 30px;">
            Best regards,<br/>
            ${safeFrom}
          </p>
        </div>
        <div style="text-align: center; padding: 15px; background: #f7fafc; font-size: 12px; color: #a0aec0;">
          This is an automated message. Please do not reply directly to this email.
        </div>
      </div>
    `;

    const port = parseInt(env.SMTP_PORT || "587");
    const secure = env.SMTP_SECURE === "true";
    const smtpPort = secure ? 465 : port;

    const smtpUrl = `smtp://${encodeURIComponent(env.SMTP_USER)}:${encodeURIComponent(env.SMTP_PASS)}@${env.SMTP_HOST}:${smtpPort}`;

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport(smtpUrl);

    await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: toEmail,
      subject: `[${safeTitle}] ${subject}`,
      html: htmlContent,
    });

    return jsonResp({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return jsonResp({ error: "Failed to send email" }, 500);
  }
}
