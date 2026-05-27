"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Briefcase,
  Loader2,
  Eye,
  Users,
  CreditCard,
} from "lucide-react";
import { FeaturedStartup, OpportunityTier } from "@/types/company";
import { getCompanyBySlug } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import CompanyLogo from "@/components/ui/CompanyLogo";
import PricingModal from "@/components/opportunities/PricingModal"; // This will be created later

export default function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [company, setCompany] = useState<FeaturedStartup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; name: string; avatar: string | null; isAdmin: boolean } | null>(null);

  const fetchCompany = async () => {
    setIsLoading(true);
    const { data, error } = await getCompanyBySlug(slug);
    if (error || !data) {
      setError("Company not found");
      setIsLoading(false);
      return;
    }
    setCompany(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const authResult = await checkAuthClient();
      if (!authResult.authenticated || !authResult.user) {
        window.location.replace(getAuthRedirectUrl());
        return;
      }
      setUser({
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        avatar: authResult.user.avatar ?? null,
        isAdmin: authResult.user.isAdmin ?? false,
      });
      await fetchCompany();
    };
    
    checkAuthAndFetch();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">{error || "Company not found"}</p>
        <Link href="/" className="text-[#3182ce] hover:underline">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[
          { label: company?.name || "Company", href: `/${slug}` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="h-16 md:h-20"></div>

          <div className="px-4 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 -mt-8 sm:-mt-10 mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                <CompanyLogo company={company} size="lg" />
              </div>

              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="pt-2 sm:pt-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {company.name}
                  </h1>
                  <p className="text-sm text-gray-500 line-clamp-5">
                    {company.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-gray-500 mb-4">
              <span>
                Created: {new Date(company.created_at).toLocaleDateString()}
              </span>
              {company.updated_at && (
                <span>
                  Updated: {new Date(company.updated_at).toLocaleDateString()}
                </span>
              )}
              {company.status === "published" && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-sm bg-green-100 text-green-700">
                    <Eye className="w-4 h-4" />
                    Published
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href={`/${slug}/profile`}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#3182ce]/30 hover:shadow-lg transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#3182ce]/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#3182ce]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Company Profile
              </h2>
              <p className="text-sm text-gray-500">
                Manage your company details
              </p>
            </div>
          </Link>

          <Link
            href={`/${slug}/users`}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#3182ce]/30 hover:shadow-lg transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#3182ce]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#3182ce]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Company Users
              </h2>
              <p className="text-sm text-gray-500">Manage team members</p>
            </div>
          </Link>

          <Link
            href={`/${slug}/events`}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#3182ce]/30 hover:shadow-lg transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#3182ce]/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#3182ce]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Company Events
              </h2>
              <p className="text-sm text-gray-500">Create and manage events</p>
            </div>
          </Link>

          <Link
            href={`/${slug}/opportunities`}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#3182ce]/30 hover:shadow-lg transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  Company Opportunities
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  company.opportunity_tier === "advanced"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {company.opportunity_tier === "advanced" ? "Advanced" : "Basic"}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Post jobs, tenders, grants
              </p>
              {(company.opportunity_tier === "free" || company.opportunity_tier === "basic") && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPricingModal(true);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3182ce] text-white rounded-xl text-sm font-medium hover:bg-[#2c5cb8] transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Upgrade to Advanced
                </button>
              )}
            </div>
          </Link>
        </div>
      </div>

      {showPricingModal && (
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          companyId={company.id}
          currentTier={company.opportunity_tier}
          onUpgradeSuccess={fetchCompany}
        />
      )}
    </div>
  );
}
