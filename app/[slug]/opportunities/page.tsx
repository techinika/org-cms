"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Briefcase,
  Loader2,
  ArrowLeft,
  MoreVertical,
  Trash2,
  Plus,
  MapPin,
} from "lucide-react";
import { FeaturedStartup, Opportunity } from "@/types/company";
import { getCompanyBySlug, getCompanyOpportunities, deleteOpportunity } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useToast } from "@/components/ui/Toast";

export default function CompanyOpportunitiesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { showToast } = useToast();
  const [company, setCompany] = useState<FeaturedStartup | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; opp: Opportunity | null }>({ open: false, opp: null });

  useEffect(() => {
    checkAuth();
  }, [slug]);

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.href = getAuthRedirectUrl();
      return;
    }
    fetchCompany();
  };

  const fetchCompany = async () => {
    setIsLoading(true);
    const { data: companyData, error: companyError } = await getCompanyBySlug(slug);
    if (companyError || !companyData) {
      setError("Company not found");
      setIsLoading(false);
      return;
    }
    setCompany(companyData);

    const { data: oppData, error: oppError } = await getCompanyOpportunities(companyData.id);
    setOpportunities(oppData || []);
    setIsLoading(false);
  };

  const handleDeleteOpportunity = async (oppId: string) => {
    setDeletingId(oppId);
    const { error } = await deleteOpportunity(oppId);
    if (!error) {
      setOpportunities(opportunities.filter(o => o.id !== oppId));
      showToast("Opportunity deleted successfully", "success");
    } else {
      showToast("Failed to delete opportunity", "error");
    }
    setDeletingId(null);
    setShowMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.opp) return;
    setDeletingId(confirmDelete.opp.id);
    const { error } = await deleteOpportunity(confirmDelete.opp.id);
    setDeletingId(null);
    setConfirmDelete({ open: false, opp: null });
    if (!error) {
      setOpportunities(opportunities.filter(o => o.id !== confirmDelete.opp!.id));
      showToast("Opportunity deleted successfully", "success");
    } else {
      showToast("Failed to delete opportunity", "error");
    }
    setShowMenu(null);
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
        <Link href="/" className="text-[#3182ce] hover:underline">Go back home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Company", href: `/${slug}` },
          { label: "Opportunities", href: `/${slug}/opportunities` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Opportunities</h1>
              <p className="text-sm text-gray-500 mt-1">Manage opportunities for {company.name}</p>
            </div>
            <Link
              href={`/${slug}/opportunities/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Opportunity
            </Link>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No opportunities yet</h2>
              <p className="text-gray-500 max-w-sm mb-6">
                Create job openings, internships, or grants for {company.name}
              </p>
              <Link
                href={`/${slug}/opportunities/new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Opportunity
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
            {opportunities.map((opp) => (
              <div key={opp.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <Link href={`/${slug}/opportunities/${opp.id}`} className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-7 h-7 text-purple-600" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/${slug}/opportunities/${opp.id}`} className="font-medium text-gray-900 hover:text-[#3182ce] transition-colors block truncate">
                    {opp.title}
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{opp.type}</span>
                    {opp.location && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {opp.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {opp.expires_at && (
                    <p className="text-sm text-gray-500">Due: {new Date(opp.expires_at).toLocaleDateString()}</p>
                  )}
                  {opp.application_link && opp.application_link !== "apply" && (
                    <p className="text-xs text-purple-600">{opp.external_link_clicks || 0} clicks</p>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    opp.status === 'Open' || opp.status === 'Closed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {opp.status || "draft"}
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(showMenu === opp.id ? null : opp.id)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  {showMenu === opp.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => { setShowMenu(null); setConfirmDelete({ open: true, opp }); }}
                        disabled={deletingId === opp.id}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        {deletingId === opp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmDelete.open}
        title="Delete Opportunity"
        message={`Are you sure you want to delete "${confirmDelete.opp?.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ open: false, opp: null })}
      />
    </div>
  );
}