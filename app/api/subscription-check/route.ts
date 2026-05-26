import { NextResponse } from "next/server";
import { checkAndNotifySubscriptionStatus } from "@/lib/subscription-server";
import { getAllCompanies } from "@/lib/supabase";

/**
 * API route to check subscription statuses and send notifications
 * This should be called periodically (e.g., daily via cron job)
 */
export async function GET() {
  try {
    // Get all companies
    const { data: companies, error } = await getAllCompanies();
    
    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch companies" },
        { status: 500 }
      );
    }

    let notificationsSent = 0;
    const failedCompanies: string[] = [];

    // Check each company's subscription status
    for (const company of companies) {
      const notified = await checkAndNotifySubscriptionStatus(company.id);
      if (notified) {
        notificationsSent++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${companies.length} companies, sent ${notificationsSent} notifications`,
      notificationsSent,
      failedCompanies: failedCompanies.length
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}