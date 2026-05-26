import { FeaturedStartup } from "@/types/company";

async function getTransporter() {
  const nodemailer = await import("nodemailer");
  return nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send subscription renewal reminder email
 */
export async function sendSubscriptionRenewalReminder(
  company: FeaturedStartup,
  daysUntilExpiration: number
): Promise<boolean> {
  if (!company.email || !process.env.SMTP_FROM) {
    console.warn("Missing email configuration for subscription reminder");
    return false;
  }

  try {
    const subject = `Your subscription expires in ${daysUntilExpiration} days`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #3182ce, #63b3ed); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Subscription Renewal Reminder</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Hello ${company.name} team,</p>
          <p>This is a friendly reminder that your opportunity subscription will expire in <strong>${daysUntilExpiration}</strong> days (on ${new Date(company.subscription_expires_at!).toLocaleDateString()}).</p>
          <p>To continue accessing advanced opportunity features, please renew your subscription before the expiration date.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="/dashboard/subscription" 
               style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Renew Subscription
            </a>
          </div>
          <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
        </div>
        <div style="text-align: center; padding: 15px; background: #f7fafc; font-size: 12px; color: #a0aec0;">
          This is an automated message. Please do not reply directly to this email.
        </div>
      </div>
    `;

    const transporter = await getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: company.email,
      subject,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("Failed to send subscription renewal reminder:", error);
    return false;
  }
}

/**
 * Send subscription expiration notice email
 */
export async function sendSubscriptionExpirationNotice(
  company: FeaturedStartup
): Promise<boolean> {
  if (!company.email || !process.env.SMTP_FROM) {
    console.warn("Missing email configuration for subscription expiration");
    return false;
  }

  try {
    const subject = "Your subscription has expired";
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #e53e3e, #fc8181); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Subscription Expired</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Hello ${company.name} team,</p>
          <p>We regret to inform you that your opportunity subscription has expired as of ${new Date(company.subscription_expires_at!).toLocaleDateString()}.</p>
          <p>As a result, your access to advanced opportunity features has been limited. You can still view existing opportunities but cannot create new ones or access the applications dashboard.</p>
          <p>To restore full access, please renew your subscription.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="/dashboard/subscription" 
               style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Renew Subscription
            </a>
          </div>
          <p>If you believe this is an error, please contact our support team immediately.</p>
        </div>
        <div style="text-align: center; padding: 15px; background: #f7fafc; font-size: 12px; color: #a0aec0;">
          This is an automated message. Please do not reply directly to this email.
        </div>
      </div>
    `;

    const transporter = await getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: company.email,
      subject,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("Failed to send subscription expiration notice:", error);
    return false;
  }
}

/**
 * Send subscription welcome email when upgrading
 */
export async function sendSubscriptionWelcomeEmail(
  company: FeaturedStartup,
  tier: "basic" | "advanced"
): Promise<boolean> {
  if (!company.email || !process.env.SMTP_FROM) {
    console.warn("Missing email configuration for subscription welcome");
    return false;
  }

  try {
    const tierName = tier === "basic" ? "Basic" : "Advanced";
    const subject = `Welcome to the ${tierName} Opportunity Tier!`;
    
    const features = tier === "advanced" 
      ? "<li>Unlimited opportunity listings</li><li>Full access to applications dashboard</li><li>AI applicant comparison</li><li>Email notifications for applications</li><li>Priority support</li>"
      : "<li>5 opportunity listings</li><li>Full access to applications dashboard</li><li>AI applicant comparison</li><li>Email notifications for applications</li>";
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #38a169, #68d391); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to ${tierName} Tier!</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Hello ${company.name} team,</p>
          <p>Thank you for upgrading to our ${tierName} opportunity tier! Your subscription is now active.</p>
          <p>Here's what you now have access to:</p>
          <ul style="margin: 20px 0; padding-left: 20px;">
            ${features}
          </ul>
          <p>You can start creating opportunities right away by visiting your opportunities dashboard.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="/${company.slug}/opportunities" 
               style="background: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Go to Opportunities
            </a>
          </div>
          <p>If you have any questions about your new subscription, please don't hesitate to reach out.</p>
        </div>
        <div style="text-align: center; padding: 15px; background: #f7fafc; font-size: 12px; color: #a0aec0;">
          This is an automated message. Please do not reply directly to this email.
        </div>
      </div>
    `;

    const transporter = await getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: company.email,
      subject,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("Failed to send subscription welcome email:", error);
    return false;
  }
}