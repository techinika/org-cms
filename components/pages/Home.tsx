"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  MapPin,
  Globe,
  ArrowRight,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { FeaturedStartup, UserCompany, AuthUser } from "@/types/company";
import { getUserCompanies, getAllCompanies, searchCompanies, claimCompany } from "@/lib/supabase";
import { getAuthUser, getAuthUrl } from "@/lib/auth";
import CreateCompanyModal from "../parts/CreateCompanyModal";
import Navbar from "../parts/Navbar";

function UserBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
      <AlertCircle className="w-3 h-3" />
      Pending
    </span>
  );
}

function CompanyDashboardContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [allCompanies, setAllCompanies] = useState<FeaturedStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimingCompanyId, setClaimingCompanyId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authUser = await getAuthUser();
      if (!authUser) {
        window.location.href = getAuthUrl();
        return;
      }
      setUser(authUser);
      await fetchCompanies(authUser.id, authUser.isAdmin);
    } catch (err) {
      console.error("Auth check failed:", err);
      window.location.href = getAuthUrl();
    }
  };

  const fetchCompanies = async (userId: string, isAdmin?: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: companiesData, error: companiesError } = await getUserCompanies(userId);
      if (companiesError) throw companiesError;
      setUserCompanies(companiesData || []);

      if (isAdmin) {
        const { data: allData, error: allError } = await getAllCompanies();
        if (allError) throw allError;
        setAllCompanies(allData || []);
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      setError("Failed to load companies");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimCompany = async (companyId: string) => {
    if (!user) return;
    setClaimingCompanyId(companyId);
    try {
      const { data, error } = await claimCompany(user.id, companyId, user.id);
      if (error) throw error;
      await checkAuth();
    } catch (err) {
      console.error("Failed to claim company:", err);
      setError("Failed to claim company");
    } finally {
      setClaimingCompanyId(null);
    }
  };

  const handleCompanyCreated = async (newCompany: FeaturedStartup) => {
    await checkAuth();
  };

  const displayCompanies = user?.isAdmin && showAllCompanies ? allCompanies : userCompanies.map(uc => uc.company).filter(Boolean) as FeaturedStartup[];
  const isAdmin = user?.isAdmin;

  const filteredCompanies = displayCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar user={user ? { name: user.name, email: user.email, avatar: user.avatar } : undefined} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Companies</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isAdmin
                ? "Manage all companies or view your assigned companies"
                : "Manage and monitor your organization profiles"}
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowAllCompanies(!showAllCompanies)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 font-medium rounded-xl transition-colors ${
                  showAllCompanies
                    ? "bg-[#3182ce] text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {showAllCompanies ? "Show My Companies" : "Show All Companies"}
              </button>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3182ce] hover:bg-[#2c5cb8] text-white font-medium rounded-xl transition-colors shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              Add Company
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
            />
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No companies found" : "No companies yet"}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
              {searchQuery
                ? "Try adjusting your search or filters"
                : isAdmin
                ? "Add or claim a company to get started"
                : "Get started by adding your first company to the ecosystem"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3182ce] hover:bg-[#2c5cb8] text-white font-medium rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Company
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => {
              const userCompany = userCompanies.find(uc => uc.company_id === company.id);
              return (
                <CompanyCard
                  key={company.id}
                  company={company}
                  status={userCompany?.status}
                  isAdmin={isAdmin}
                  onClaim={() => handleClaimCompany(company.id)}
                  claiming={claimingCompanyId === company.id}
                />
              );
            })}
          </div>
        )}
      </main>

      <CreateCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCompanyCreated}
        userId={user?.id}
      />
    </div>
  );
}

function CompanyCard({
  company,
  status,
  isAdmin,
  onClaim,
  claiming,
}: {
  company: FeaturedStartup;
  status?: string;
  isAdmin?: boolean;
  onClaim: () => void;
  claiming: boolean;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:border-[#3182ce]/30 hover:shadow-lg transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-7 h-7 text-gray-300" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {status && <UserBadge status={status} />}
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
          {company.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[40px]">
          {company.description}
        </p>

        {company.location && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
            <MapPin className="w-3.5 h-3.5" />
            {company.location}
          </div>
        )}

        {!isAdmin && company.claimed && !status && (
          <button
            onClick={onClaim}
            disabled={claiming}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#3182ce] hover:text-[#2c5cb8] transition-colors disabled:opacity-50"
          >
            {claiming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Claim Company
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}

        {status && (
          <a
            href={`/company/${company.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#3182ce] hover:text-[#2c5cb8] transition-colors"
          >
            Manage Profile
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {company.website && (
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              Website
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          Added {new Date(company.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default function CompanyDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
      </div>
    }>
      <CompanyDashboardContent />
    </Suspense>
  );
}