"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Briefcase,
  Loader2,
  Trash2,
  ExternalLink,
  MousePointerClick,
  Users,
  Pencil,
  ArrowRight,
} from "lucide-react";
import { Opportunity } from "@/types/company";
import { getOpportunityById, workerFetch } from "@/lib/worker";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useToast } from "@/components/ui/Toast";

export default function OpportunityPage({
  params,
}: {
  params: Promise<{ slug: string; "opp-id": string }>;
}) {
  const { slug, "opp-id": oppId } = use(params);
  const { showToast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      // Don't modify window.location here - handle in useEffect
      return { shouldRedirect: true };
    }
    return { shouldRedirect: false };
  };

  const fetchOpportunity = async () => {
    setIsLoading(true);
    const { data, error } = await getOpportunityById(oppId);
    if (error || !data) {
      setError("Opportunity not found");
      setIsLoading(false);
      return;
    }
    
    setOpportunity(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const authResult = await checkAuthClient();
      if (!authResult.authenticated || !authResult.user) {
        window.location.replace(getAuthRedirectUrl());
        return;
      }
      await fetchOpportunity();
    };
    
    checkAuthAndFetch();
  }, [slug, oppId]);

  const handleApplicationLinkClick = async () => {
    if (
      opportunity?.application_link &&
      opportunity.application_link !== "apply"
    ) {
      const res = await workerFetch(`/api/opportunities/${oppId}/click`, { method: "POST" });
      if (res.ok) {
        setOpportunity((prev) =>
          prev
            ? {
                ...prev,
                external_link_clicks: (prev.external_link_clicks || 0) + 1,
              }
            : null,
        );
      }
    }
  };

  const handleDelete = async () => {
    setDeletingId(oppId);
    const res = await workerFetch(`/api/opportunities/${oppId}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete opportunity");
      showToast("Failed to delete opportunity", "error");
    }
    setDeletingId(null);
    setShowDeleteModal(false);
    if (res.ok) {
      showToast("Opportunity deleted successfully", "success");
      window.location.href = `/${slug}/opportunities`;
    }
  };

  if (isLoading && !opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
      </div>
    );
  }

    if (error || !opportunity) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <p className="text-gray-500 mb-4">{error || "Opportunity not found"}</p>
                <Link
                    href={`/${slug}/opportunities`}
                    className="text-[#3182ce] hover:underline"
                >
                    Go back
                </Link>
            </div>
        );
    }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: "Opportunities", href: `/${slug}/opportunities` },
            {
              label: opportunity?.title || "Opportunity",
              href: `/${slug}/opportunities/${oppId}`,
            },
          ]}
        />

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {opportunity.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {opportunity.type} • {opportunity.location}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  opportunity.status === "Open"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {opportunity.status}
              </span>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {opportunity.application_link &&
              opportunity.application_link !== "apply" && (
                <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MousePointerClick className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">
                          Application Link Clicks
                        </p>
                        <p className="text-xs text-purple-600">
                          Track how many people clicked the application link
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-900">
                        {opportunity?.external_link_clicks || 0}
                      </p>
                      <p className="text-xs text-purple-600">total clicks</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-purple-600" />
                    <a
                      href={opportunity.application_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleApplicationLinkClick}
                      className="text-sm text-purple-700 hover:text-purple-900 hover:underline truncate"
                    >
                      {opportunity.application_link}
                    </a>
                  </div>
                </div>
              )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                href={`/${slug}/opportunities/${oppId}/applications`}
                className="p-5 rounded-xl border border-gray-200 hover:border-[#3182ce] hover:bg-[#3182ce]/5 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-[#3182ce] transition-colors">
                      Applications
                    </p>
                    <p className="text-sm text-gray-500">
                      Manage incoming applications, update statuses, send feedback
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-[#3182ce] font-medium">
                  View Applications
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>

              <Link
                href={`/${slug}/opportunities/${oppId}/edit`}
                className="p-5 rounded-xl border border-gray-200 hover:border-[#3182ce] hover:bg-[#3182ce]/5 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-[#3182ce] transition-colors">
                      Edit Opportunity
                    </p>
                    <p className="text-sm text-gray-500">
                      Update details, description, requirements, and settings
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-[#3182ce] font-medium">
                  Edit Details
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Opportunity Details
          </h2>
          <dl className="grid sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">Type</dt>
              <dd className="text-sm font-medium text-gray-900">
                {opportunity.type}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Location</dt>
              <dd className="text-sm font-medium text-gray-900">
                {opportunity.location}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Work Mode</dt>
              <dd className="text-sm font-medium text-gray-900">
                {opportunity.work_mode}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Employment Type</dt>
              <dd className="text-sm font-medium text-gray-900">
                {opportunity.employment_type}
              </dd>
            </div>
            {opportunity.salary && (
              <div>
                <dt className="text-sm text-gray-500">Salary</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {opportunity.salary}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd className="text-sm font-medium">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    opportunity.status === "Open"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {opportunity.status}
                </span>
              </dd>
            </div>
            {opportunity.expires_at && (
              <div>
                <dt className="text-sm text-gray-500">Deadline</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(opportunity.expires_at).toLocaleDateString()}
                </dd>
              </div>
            )}
            {opportunity.application_link && (
              <div>
                <dt className="text-sm text-gray-500">Application Link</dt>
                <dd className="text-sm font-medium text-[#3182ce] truncate">
                  {opportunity.application_link === "apply"
                    ? "Internal Form"
                    : opportunity.application_link}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          title="Delete Opportunity"
          message={`Are you sure you want to delete "${opportunity.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
