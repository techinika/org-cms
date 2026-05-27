"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Loader2,
  DollarSign,
  Users,
  Briefcase,
  CalendarDays,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  Mail,
  ArrowRight,
} from "lucide-react";
import { FeaturedStartup, UserCompany, Opportunity } from "@/types/company";
import { getCompanyBySlug, getCompanyOpportunities, getCompanyUsers } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { useToast } from "@/components/ui/Toast";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const showToast = useToast();
  const [company, setCompany] = useState<FeaturedStartup | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [users, setUsers] = useState<UserCompany[]>([]);
  const [dashboardIsLoading, setDashboardIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setDashboardIsLoading(true);
    
    try {
      // Fetch company data
      const { data: companyData, error: companyError } = await getCompanyBySlug(slug);
      if (companyError || !companyData) {
        setError("Company not found");
        setDashboardIsLoading(false);
        return;
      }
      setCompany(companyData);

      // Fetch opportunities
      const { data: oppData, error: oppError } = await getCompanyOpportunities(companyData.id);
      setOpportunities(oppData || []);

      // Fetch company users/team members
      const { data: usersData, error: usersError } = await getCompanyUsers(companyData.id);
      setUsers(usersData || []);

      setDashboardIsLoading(false);
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("Failed to load dashboard data");
      setDashboardIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const authResult = await checkAuthClient();
      if (!authResult.authenticated || !authResult.user) {
        window.location.replace(getAuthRedirectUrl());
        return;
      }
      await fetchDashboardData();
    };
    
    checkAuthAndFetch();
  }, [slug]);

  if (dashboardIsLoading) {
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
        <Link href="/" className="text-[#3182ce] hover:underline">Go back home</Link>
      </div>
    );
  }

  // Calculate subscription stats
  const tier = company.opportunity_tier || "free";
  const listingsUsed = company.opportunity_listings_used || 0;
  const listingsPurchased = company.opportunity_listings_purchased || 0;
  const listingsRemaining = tier === "basic" ? Math.max(0, listingsPurchased - listingsUsed) : "Unlimited";
  const subscriptionActive = company.subscription_expires_at 
    ? new Date(company.subscription_expires_at) > new Date()
    : false;
  const daysUntilExpiration = company.subscription_expires_at
    ? Math.max(0, Math.ceil((new Date(company.subscription_expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Dashboard", href: `/${slug}/dashboard` },
        ]} />
        
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
              <p className="text-sm text-gray-500">Overview of {company.name}&apos;s subscription and activity</p>
            </div>
            <Link
              href={`/${slug}/opportunities`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              Manage Opportunities
            </Link>
          </div>
        </div>
        
        {/* Subscription Overview Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Overview</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tier Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Current Tier</h3>
                  <p className={`text-sm font-medium capitalize ${tier === "advanced" ? "text-green-600" : tier === "basic" ? "text-blue-600" : "text-gray-500"}`}>
                    {tier} tier
                  </p>
                </div>
              </div>
              
              {/* Subscription Status */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  {subscriptionActive ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Subscription Status</h3>
                  <p className={`text-sm font-medium ${subscriptionActive ? "text-green-600" : "text-red-500"}`}>
                    {subscriptionActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
              
              {/* Days Until Expiration */}
              {daysUntilExpiration !== null && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <CalendarDays className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Days Until Expiration</h3>
                    <p className={`text-sm font-medium ${daysUntilExpiration <= 7 ? "text-red-500" : "text-gray-600"}`}>
                      {daysUntilExpiration === 0 ? "Expired today" : daysUntilExpiration + " days"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Usage Statistics */}
            <div className="space-y-4">
              {/* Listings Used */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Listings Used</h3>
                  <p className="text-sm font-medium text-gray-600">
                    {listingsUsed} / {tier === "basic" ? listingsPurchased : "∞"}
                  </p>
                </div>
              </div>
              
              {/* Listings Remaining */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Listings Remaining</h3>
                  <p className="text-sm font-medium text-gray-600">
                    {listingsRemaining === "Unlimited" ? "Unlimited" : listingsRemaining}
                  </p>
                </div>
              </div>
              
              {/* Renewal Date */}
              {company.subscription_expires_at && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Renewal Date</h3>
                    <p className="text-sm font-medium text-gray-600">
                      {new Date(company.subscription_expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Upgrade/Cta Button */}
          {tier !== "advanced" && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href={`/${slug}/opportunities`}
                onClick={() => {
                  // This would typically open a modal, but for simplicity we're linking to opportunities
                  // which will show the upgrade prompt if needed
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
              >
                {tier === "free" ? "Upgrade to Access Opportunities" : "Upgrade to Advanced Tier"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
        
        {/* Activity Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Opportunities Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Opportunities</h3>
                  <p className="text-sm text-gray-500">Total posted</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{opportunities.length}</p>
            </div>
            <div className="mt-4">
              {opportunities.length > 0 ? (
                <div className="space-y-2">
                  {opportunities.slice(0, 3).map((opp) => (
                    <div key={opp.id} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs">{opp.type?.charAt(0)}</span>
                      </div>
                      <span className="flex-1 truncate">{opp.title}</span>
                      <span className={`text-xs px-1.5 rounded-full ${opp.status === "Open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {opp.status}
                      </span>
                    </div>
                  ))}
                  {opportunities.length > 3 && (
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      +{opportunities.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center">
                  No opportunities yet. Create your first opportunity to get started.
                </p>
              )}
            </div>
          </div>
          
          {/* Team Members Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                  <p className="text-sm text-gray-500">People with access</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="mt-4">
              {users.length > 0 ? (
                <div className="space-y-2">
                  {users.slice(0, 3).map((user) => (
                    <div key={user.id} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs">{user.author?.name?.charAt(0) ?? "?"}</span>
                      </div>
                      <span className="flex-1 truncate">{user.author?.name || "Unknown"}</span>
                      <span className="text-xs text-gray-500">{user.role}</span>
                    </div>
                  ))}
                  {users.length > 3 && (
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      +{users.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center">
                  No team members added yet. Invite collaborators to manage opportunities together.
                </p>
              )}
            </div>
          </div>
          
          {/* Applications Received Card (placeholder for future enhancement) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
                  <p className="text-sm text-gray-500">Received this month</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500 text-center">
                Application statistics coming soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}