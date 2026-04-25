"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Briefcase,
  Loader2,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { FeaturedStartup } from "@/types/company";
import { getCompanyBySlug } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";

export default function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [company, setCompany] = useState<FeaturedStartup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [slug]);

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.href = getAuthRedirectUrl();
      return;
    }
    setUser({
      name: authResult.user.name,
      email: authResult.user.email,
      avatar: authResult.user.avatar,
    });
    fetchCompany();
  };

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
      <Navbar user={user || undefined} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#3182ce] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Companies
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="h-16 md:h-20"></div>

          <div className="px-4 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 -mt-8 sm:-mt-10 mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                )}
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

            <div className="flex flex-wrap items-center justify-betweenFi gap-3 text-xs sm:text-sm text-gray-500 mb-4">
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
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Company Opportunities
              </h2>
              <p className="text-sm text-gray-500">
                Post jobs, tenders, grants
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
