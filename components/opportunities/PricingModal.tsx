"use client";

import { useState } from "react";
import { use } from "react";
import {
  X,
  CheckCircle,
  DollarSign,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { OpportunityTier } from "@/types/company";
import { workerFetch } from "@/lib/worker";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  currentTier?: OpportunityTier;
  onUpgradeSuccess: () => void;
}

export default function PricingModal({
  isOpen,
  onClose,
  companyId,
  currentTier,
  onUpgradeSuccess,
}: PricingModalProps) {
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"listings" | "subscription" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async (tier: OpportunityTier, listings?: number) => {
    setIsProcessing(true);
    let updates: Partial<Record<string, unknown>> = { opportunity_tier: tier };

    if (tier === "advanced" && selectedPlan === "subscription") {
      const now = new Date();
      const expires = new Date();
      expires.setMonth(now.getMonth() + 1);
      updates = {
        ...updates,
        subscription_started_at: now.toISOString(),
        subscription_expires_at: expires.toISOString(),
        opportunity_listings_purchased: 0,
        opportunity_listings_used: 0,
      };
    } else if (tier === "advanced" && selectedPlan === "listings" && listings) {
      updates = {
        ...updates,
        opportunity_listings_purchased: (currentTier === "advanced" ? 0 : (listings || 0)), // Reset if already advanced
        opportunity_listings_used: 0,
        subscription_started_at: null,
        subscription_expires_at: null,
      };
    }

    const res = await workerFetch(`/api/companies/${companyId}/tier`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      showToast("Upgrade failed", "error");
    } else {
      showToast("Upgrade successful!", "success");
      onUpgradeSuccess();
      onClose();
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto transform transition-all shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upgrade Opportunities</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Unlock advanced features for your company&apos;s opportunities.
        </p>

        <div className="grid gap-4 mb-6">
          <div
            className={`p-5 border rounded-xl cursor-pointer transition-all ${selectedPlan === "listings" ? "border-[#3182ce] ring-2 ring-[#3182ce]/20" : "border-gray-200 hover:border-gray-300"}`}
            onClick={() => setSelectedPlan("listings")}
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-900">Buy 5 Listings</h3>
            </div>
            <p className="text-gray-600 mb-3">One-time purchase for 5 advanced opportunity listings. No recurring fees.</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Full access to Applications Dashboard</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> AI Applicant Comparison</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Email notifications for applications</li>
            </ul>
            <button
              onClick={(e) => { e.stopPropagation(); handleUpgrade("advanced", 5); }}
              disabled={isProcessing || selectedPlan !== "listings"}
              className="mt-4 w-full py-2.5 px-4 bg-[#3182ce] text-white rounded-xl font-medium hover:bg-[#2c5cb8] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing && selectedPlan === "listings" ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Pay $49.99
            </button>
          </div>

          <div
            className={`p-5 border rounded-xl cursor-pointer transition-all ${selectedPlan === "subscription" ? "border-[#3182ce] ring-2 ring-[#3182ce]/20" : "border-gray-200 hover:border-gray-300"}`}
            onClick={() => setSelectedPlan("subscription")}
          >
            <div className="flex items-center gap-3 mb-2">
              <CalendarDays className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Monthly Subscription</h3>
            </div>
            <p className="text-gray-600 mb-3">Unlimited advanced opportunity listings with full platform features. Billed monthly.</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Unlimited Listings</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Full access to Applications Dashboard</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> AI Applicant Comparison</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Email notifications for applications</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Priority Support</li>
            </ul>
            <button
              onClick={(e) => { e.stopPropagation(); handleUpgrade("advanced"); }}
              disabled={isProcessing || selectedPlan !== "subscription"}
              className="mt-4 w-full py-2.5 px-4 bg-[#3182ce] text-white rounded-xl font-medium hover:bg-[#2c5cb8] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing && selectedPlan === "subscription" ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Pay $19.99/month
            </button>
          </div>
        </div>

        {isProcessing && (
          <p className="text-center text-sm text-gray-500 mt-4">Processing your upgrade...</p>
        )}

        <p className="text-xs text-gray-500 mt-4 text-center">
          Payments are simulated for demonstration. In a real application, this would integrate with a payment gateway.
        </p>
      </div>
    </div>
  );
}
