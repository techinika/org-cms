import { Env } from "../env";

interface Company {
  id: string;
  name: string;
  email: string | null;
  slug: string | null;
  opportunity_tier: string;
  subscription_expires_at: string | null;
}

async function fetchCompanies(env: Env): Promise<Company[]> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/featured_startups?select=id,name,email,slug,opportunity_tier,subscription_expires_at`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json() as Promise<Company[]>;
}

async function updateCompany(env: Env, companyId: string, updates: Record<string, unknown>): Promise<void> {
  await fetch(`${env.SUPABASE_URL}/rest/v1/featured_startups?id=eq.${companyId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendEmail(env: Env, to: string, subject: string, html: string): Promise<void> {
  const port = parseInt(env.SMTP_PORT || "587");
  const secure = env.SMTP_SECURE === "true";
  const smtpPort = secure ? 465 : port;
  const smtpUrl = `smtp://${encodeURIComponent(env.SMTP_USER)}:${encodeURIComponent(env.SMTP_PASS)}@${env.SMTP_HOST}:${smtpPort}`;

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport(smtpUrl);
  await transporter.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to,
    subject,
    html,
  });
}

function buildRenewalEmail(env: Env, companyName: string, days: number, expiresAt: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #3182ce, #63b3ed); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Subscription Renewal Reminder</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
        <p>Hello ${escapeHtml(companyName)} team,</p>
        <p>This is a friendly reminder that your opportunity subscription will expire in <strong>${days}</strong> days (on ${expiresAt}).</p>
        <p>To continue accessing advanced opportunity features, please renew your subscription before the expiration date.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.BASE_URL}/dashboard/subscription"
             style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Renew Subscription
          </a>
        </div>
        <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
      </div>
      <div style="text-align: center; padding: 15px; background: #f7fafc; font-size: 12px; color: #a0aec0;">
        This is an automated message. Please do not reply directly to this email.
      </div>
    </div>`;
}

function buildExpirationEmail(env: Env, companyName: string, expiresAt: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #e53e3e, #fc8181); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Subscription Expired</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
        <p>Hello ${escapeHtml(companyName)} team,</p>
        <p>We regret to inform you that your opportunity subscription has expired as of ${expiresAt}.</p>
        <p>As a result, your access to advanced opportunity features has been limited.</p>
        <p>To restore full access, please renew your subscription.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.BASE_URL}/dashboard/subscription"
             style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Renew Subscription
          </a>
        </div>
      </div>
      <div style="text-align: center; padding: 15px; background: #f7fafc; font-size: 12px; color: #a0aec0;">
        This is an automated message. Please do not reply directly to this email.
      </div>
    </div>`;
}

export async function handleSubscriptionCheck(
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

  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${env.WORKER_API_KEY}`) {
    return jsonResp({ error: "Unauthorized" }, 401);
  }

  try {
    const companies = await fetchCompanies(env);
    let notificationsSent = 0;

    for (const company of companies) {
      if (!company.subscription_expires_at || company.opportunity_tier !== "advanced") {
        continue;
      }

      const expirationDate = new Date(company.subscription_expires_at);
      const now = new Date();
      const timeDiff = expirationDate.getTime() - now.getTime();
      const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));

      try {
        if (daysUntilExpiration === 7 || daysUntilExpiration === 3 || daysUntilExpiration === 1) {
          if (company.email) {
            await sendEmail(
              env,
              company.email,
              `Your subscription expires in ${daysUntilExpiration} days`,
              buildRenewalEmail(env, company.name, daysUntilExpiration, expirationDate.toLocaleDateString())
            );
            notificationsSent++;
          }
        }

        if (daysUntilExpiration < 0) {
          if (company.email) {
            await sendEmail(
              env,
              company.email,
              "Your subscription has expired",
              buildExpirationEmail(env, company.name, expirationDate.toLocaleDateString())
            );
            notificationsSent++;
          }

          await updateCompany(env, company.id, {
            opportunity_tier: "free",
            subscription_started_at: null,
            subscription_expires_at: null,
          });
        }
      } catch (err) {
        console.error(`Failed to notify company ${company.id}:`, err);
      }
    }

    return jsonResp({
      success: true,
      message: `Checked ${companies.length} companies, sent ${notificationsSent} notifications`,
      notificationsSent,
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return jsonResp({ error: "Internal server error" }, 500);
  }
}
