"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Plus,
  Search,
  MapPin,
  Globe,
  ArrowRight,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { FeaturedStartup, UserCompany, AuthUser } from "@/types/company";
import { getUserCompanies, getAllCompanies, claimCompany, getUserPendingRequests, supabase } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import CreateCompanyModal from "../parts/CreateCompanyModal";
import Navbar from "../parts/Navbar";
import { useToast } from "../ui/Toast";
import ConfirmationModal from "../ui/ConfirmationModal";
import CompanyLogo from "../ui/CompanyLogo";

function UserBadge({ status }: { status: string | null | undefined }) {
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  }
  if (status === "confirmation_pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
        <AlertCircle className="w-3 h-3" />
        Awaiting Approval
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
        <AlertCircle className="w-3 h-3" />
        Rejected
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
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [userPendingRequests, setUserPendingRequests] = useState<UserCompany[]>([]);
  const [allCompanies, setAllCompanies] = useState<FeaturedStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<AuthUser & { profilePicture?: string | null; authName?: string | null } | null>(null);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimingCompanyId, setClaimingCompanyId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ open: boolean; companyId: string | null; companyName: string | null }>({ open: false, companyId: null, companyName: null });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authResult = await checkAuthClient();
      if (!authResult.authenticated || !authResult.user) {
        window.location.replace(getAuthRedirectUrl());
        return;
      }
      setUser({
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        avatar: authResult.user.avatar,
        isAdmin: authResult.isAdmin,
        profilePicture: authResult.profilePicture,
        authName: authResult.name,
      });
      await fetchCompanies(authResult.user.id, authResult.isAdmin);
    } catch (err) {
      console.error("Auth check failed:", err);
      window.location.replace(getAuthRedirectUrl());
    }
  };

  const fetchCompanies = async (userId: string, isAdmin?: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const [{ data: companiesData, error: companiesError }, { data: pendingData, error: pendingError }] = await Promise.all([
        getUserCompanies(userId),
        getUserPendingRequests(userId),
      ]);
      
      if (companiesError) throw companiesError;
      setUserCompanies(companiesData || []);
      
      if (pendingError) {
        console.error("Failed to fetch pending requests:", pendingError);
      }
      setUserPendingRequests(pendingData || []);

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

  const handleCancelRequest = (companyId: string, companyName: string) => {
    setConfirmCancel({ open: true, companyId, companyName });
  };

  const confirmCancelRequest = async () => {
    if (!user || !confirmCancel.companyId) return;
    setClaimingCompanyId(confirmCancel.companyId);
    try {
      const { error } = await supabase
        .from("user_company")
        .delete()
        .eq("user_id", user.id)
        .eq("company_id", confirmCancel.companyId)
        .eq("status", "confirmation_pending");

      if (error) throw error;
      showToast("Request cancelled", "success");
      setConfirmCancel({ open: false, companyId: null, companyName: null });
      await checkAuth();
    } catch (err) {
      console.error("Failed to cancel request:", err);
      setError("Failed to cancel request");
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
      <Navbar />

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
              className="pl-12 input-lg bg-white"
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
                  onCancelClick={() => handleCancelRequest(company.id, company.name)}
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
        userCompanyIds={userCompanies.map(uc => uc.company_id).filter(Boolean) as string[]}
        userPendingCompanyIds={userPendingRequests.map(ur => ur.company_id).filter(Boolean) as string[]}
      />

      <ConfirmationModal
        isOpen={confirmCancel.open}
        title="Cancel Request"
        message={`Are you sure you want to cancel your request to join "${confirmCancel.companyName}"?`}
        confirmLabel="Cancel Request"
        onConfirm={confirmCancelRequest}
        onCancel={() => setConfirmCancel({ open: false, companyId: null, companyName: null })}
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
  onCancelClick,
}: {
  company: FeaturedStartup;
  status?: string | null;
  isAdmin?: boolean;
  onClaim: () => void;
  claiming: boolean;
  onCancelClick?: () => void;
}) {
  const canAccess = status === "accepted" || status === "active";
  const isPendingConfirmation = status === "confirmation_pending";
  const isRejected = status === "rejected";
  const isClaimed = company.claimed === true;

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:border-[#3182ce]/30 hover:shadow-lg transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
            <CompanyLogo company={company} size="md" />
          </div>
          <div className="flex items-center gap-2">
            {status && <UserBadge status={status} />}
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

        {!isAdmin && isClaimed && !status && (
          <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
            <AlertCircle className="w-4 h-4" />
            Already Claimed
          </div>
        )}

        {!isAdmin && !isClaimed && !status && (
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

        {isPendingConfirmation && (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-orange-600">
              <AlertCircle className="w-4 h-4" />
              Awaiting Approval
            </div>
            {onCancelClick && (
              <button
                onClick={onCancelClick}
                disabled={claiming}
                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        )}

        {isRejected && (
          <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
            <AlertCircle className="w-4 h-4" />
            Request Rejected
          </div>
        )}

        {canAccess && (
          <a
            href={`/${company.slug || company.id}`}
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