import { supabase } from "./supabase";
import { FeaturedStartup } from "@/types/company";

export async function updateCompanyTier(companyId: string, updates: {
  opportunity_tier?: string;
  opportunity_listings_purchased?: number;
  opportunity_listings_used?: number;
  subscription_started_at?: string;
  subscription_expires_at?: string;
}): Promise<{ error: Error | null }> {
  const { data: currentCompany } = await supabase
    .from("featured_startups")
    .select("opportunity_tier, email, name, slug")
    .eq("id", companyId)
    .single();

  const { error } = await supabase
    .from("featured_startups")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", companyId);

  if (error) return { error };

  if (updates.opportunity_tier && currentCompany) {
    const oldTier = currentCompany.opportunity_tier;
    const newTier = updates.opportunity_tier;

    if (
      (newTier === "basic" && oldTier !== "basic") ||
      (newTier === "advanced" && oldTier !== "advanced")
    ) {
      import("./email").then(({ sendSubscriptionWelcomeEmail }) => {
        sendSubscriptionWelcomeEmail(currentCompany as FeaturedStartup, newTier as "basic" | "advanced").catch(
          (emailError: unknown) => {
            console.error("Failed to send welcome email:", emailError);
          }
        );
      });
    }
  }

  return { error };
}

export async function checkAndNotifySubscriptionStatus(companyId: string): Promise<boolean> {
  try {
    const { data: company, error } = await supabase
      .from("featured_startups")
      .select("id, name, email, opportunity_tier, subscription_expires_at")
      .eq("id", companyId)
      .single();

    if (error || !company) {
      console.error("Company not found:", error);
      return false;
    }

    if (!company.subscription_expires_at || company.opportunity_tier !== "advanced") {
      return false;
    }

    const expirationDate = new Date(company.subscription_expires_at);
    const now = new Date();
    const timeDiff = expirationDate.getTime() - now.getTime();
    const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysUntilExpiration === 7 || daysUntilExpiration === 3 || daysUntilExpiration === 1) {
      const { sendSubscriptionRenewalReminder } = await import("./email");
      sendSubscriptionRenewalReminder(company as FeaturedStartup, daysUntilExpiration).catch(() => {});
      return true;
    }

    if (daysUntilExpiration < 0) {
      const { sendSubscriptionExpirationNotice } = await import("./email");
      sendSubscriptionExpirationNotice(company as FeaturedStartup).catch(() => {});
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error in checkAndNotifySubscriptionStatus:", error);
    return false;
  }
}
