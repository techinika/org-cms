"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Briefcase,
  Loader2,
  ArrowLeft,
  MapPin,
  Globe,
  Mail,
  Clock,
  Users,
  Save,
  Trash2,
  DollarSign,
  MessageSquare,
  ArrowRight,
  Sparkles,
  CheckCircle,
  XCircle,
  ExternalLink,
  MousePointerClick,
} from "lucide-react";
import {
  Opportunity,
  OPPORTUNITY_TYPES,
  WORK_MODES,
  EMPLOYMENT_TYPES,
} from "@/types/company";
import {
  getOpportunityById,
  updateOpportunity,
  getOpportunityApplications,
  deleteOpportunity,
  updateApplicationFeedback,
} from "@/lib/supabase";
import { compareApplicants, ApplicantScore } from "@/lib/ai";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import RichTextEditor from "@/components/parts/RichTextEditor";
import ApplicationList from "@/components/opportunities/ApplicationList";
import ApplicationDetailModal from "@/components/opportunities/ApplicationDetailModal";
import FeedbackModal from "@/components/opportunities/FeedbackModal";
import AIScoreModal from "@/components/opportunities/AIScoreModal";
import { getDefaultEmailMessage } from "@/components/opportunities/shared";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useToast } from "@/components/ui/Toast";

const APPLICATION_PROGRESS_STAGES = [
  { key: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { key: "in_review", label: "In Review", color: "bg-blue-100 text-blue-700" },
  {
    key: "interview_pending",
    label: "Interview Pending",
    color: "bg-purple-100 text-purple-700",
  },
  {
    key: "technical_exam_pending",
    label: "Technical Exam",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    key: "contract_signing_pending",
    label: "Contract Signing",
    color: "bg-orange-100 text-orange-700",
  },
  { key: "hired", label: "Hired", color: "bg-green-100 text-green-700" },
  {
    key: "started_job",
    label: "Started Job",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "started_internship",
    label: "Started Internship",
    color: "bg-emerald-100 text-emerald-700",
  },
  { key: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
  {
    key: "not_proceeding",
    label: "Not Proceeding",
    color: "bg-gray-100 text-gray-700",
  },
  { key: "quit", label: "Quit", color: "bg-gray-100 text-gray-700" },
];

function getProgressLabel(status: string | null | undefined): string {
  const stage = APPLICATION_PROGRESS_STAGES.find((s) => s.key === status);
  return stage?.label || "Pending";
}

export default function OpportunityPage({
  params,
}: {
  params: Promise<{ slug: string; "opp-id": string }>;
}) {
  const { slug, "opp-id": oppId } = use(params);
  const { showToast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalApps, setTotalApps] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("in_review");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [isAIScoreLoading, setIsAIScoreLoading] = useState(false);
  const [applicantScores, setApplicantScores] = useState<ApplicantScore[]>([]);
  const [showAIScoreModal, setShowAIScoreModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    full_description: "",
    requirements: "",
    benefits: "",
    type: "",
    location: "",
    salary: "",
    application_link: "",
    contact_email: "",
    work_mode: "Hybrid",
    employment_type: "Full-Time",
    country: "",
    status: "draft",
    expires_at: "",
  });

  const totalPages = Math.ceil(totalApps / 50);

  const fetchOpportunity = async () => {
    setIsLoading(true);
    const { data, error } = await getOpportunityById(oppId);
    if (error || !data) {
      setError("Opportunity not found");
      setIsLoading(false);
      return;
    }
    setOpportunity(data);
    setFormData({
      title: data.title || "",
      description: data.description || "",
      full_description: data.full_description || "",
      requirements: data.requirements || "",
      benefits: data.benefits || "",
      type: data.type || "",
      location: data.location || "",
      salary: data.salary || "",
      application_link: data.application_link || "",
      contact_email: data.contact_email || "",
      work_mode: data.work_mode || "Hybrid",
      employment_type: data.employment_type || "Full-Time",
      country: data.country || "",
      status: data.status || "draft",
      expires_at: data.expires_at ? data.expires_at.split("T")[0] : "",
    });
    await fetchApplications(1);
  };

  const fetchApplications = async (page: number) => {
    setIsLoading(true);
    const result = await getOpportunityApplications(oppId, page, 50);
    setApplications(result.data || []);
    setTotalApps(result.total);
    setCurrentPage(page);
    setIsLoading(false);
  };

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
    fetchOpportunity();
  };

  useEffect(() => {
    checkAuth();
  }, [slug, oppId]);

  const saveOpportunity = async () => {
    if (!opportunity) return;
    setIsSaving(true);
    const { data, error } = await updateOpportunity(oppId, {
      ...formData,
      expires_at: formData.expires_at
        ? new Date(formData.expires_at).toISOString()
        : null,
    } as Partial<Opportunity>);
    if (error) {
      setError("Failed to save");
      showToast("Failed to save changes", "error");
    } else if (data) {
      setOpportunity(data);
      showToast("Changes saved successfully", "success");
    }
    setIsSaving(false);
  };

  const handleApplicationLinkClick = async () => {
    if (formData.application_link && formData.application_link !== "apply") {
      await updateOpportunity(oppId, {
        external_link_clicks: (opportunity?.external_link_clicks || 0) + 1,
      } as Partial<Opportunity>);
      setOpportunity((prev) => prev ? { ...prev, external_link_clicks: (prev.external_link_clicks || 0) + 1 } : null);
    }
  };

  const handleDelete = async () => {
    setDeletingId(oppId);
    const { error } = await deleteOpportunity(oppId);
    if (error) {
      setError("Failed to delete opportunity");
      showToast("Failed to delete opportunity", "error");
    }
    setDeletingId(null);
    setShowDeleteModal(false);
    if (!error) {
      showToast("Opportunity deleted successfully", "success");
      window.location.href = `/${slug}/opportunities`;
    }
  };

  const openFeedbackModal = (app: any, status: string) => {
    setSelectedApp(app);
    setFeedbackStatus(status);
    setFeedbackMessage(
      getDefaultEmailMessage(
        status,
        app.name || app.company_name || "Applicant",
      ),
    );
    setShowFeedbackModal(true);
  };

  const handleStatusUpdate = async (
    appId: string,
    newStatus: string,
    message?: string,
  ) => {
    setIsSendingFeedback(true);
    await updateApplicationFeedback(appId, newStatus, message, user?.email);

    const app = applications.find((a) => a.id === appId);
    const recipientEmail = app?.email || app?.tender_email;
    if (recipientEmail && message) {
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: recipientEmail,
            subject: getProgressLabel(newStatus),
            message: message,
            applicantName: app?.name || app?.company_name,
            opportunityTitle: opportunity?.title,
          }),
        });
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
      }
    }

    const result = await getOpportunityApplications(oppId, currentPage, 50);
    setApplications(result.data || []);
    if (selectedApp?.id === appId) {
      const updated = result.data?.find((a) => a.id === appId);
      if (updated) setSelectedApp(updated);
    }
    setIsSendingFeedback(false);
    setShowFeedbackModal(false);
    setFeedbackMessage("");
  };

  const filteredApps = applications.filter((app) => {
    if (showAIScoreModal) {
      const scored = applicantScores.find((s) => s.id === app.id);
      if (scored && statusFilter !== "all") {
        if (statusFilter === "pending") return scored.score < 50;
        if (statusFilter === "in_review")
          return scored.score >= 50 && scored.score < 70;
        if (statusFilter === "interview_pending") return scored.score >= 70;
        if (statusFilter === "rejected") return scored.score < 30;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          app.name?.toLowerCase().includes(q) ||
          app.email?.toLowerCase().includes(q) ||
          app.location?.toLowerCase().includes(q) ||
          app.company_name?.toLowerCase().includes(q)
        );
      }
      return true;
    }

    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        if (app.feedback?.[0]) return false;
        return true;
      }
      const fb = app.feedback?.[0];
      if (fb?.status !== statusFilter) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        app.name?.toLowerCase().includes(q) ||
        app.email?.toLowerCase().includes(q) ||
        app.location?.toLowerCase().includes(q) ||
        app.company_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: totalApps,
    pending: applications.filter((a) => !a.feedback?.[0]).length,
    in_review: applications.filter(
      (a) => a.feedback?.[0]?.status === "in_review",
    ).length,
    interview: applications.filter(
      (a) => a.feedback?.[0]?.status === "interview_pending",
    ).length,
    hired: applications.filter((a) =>
      ["hired", "started_job", "started_internship"].includes(
        a.feedback?.[0]?.status || "",
      ),
    ).length,
    rejected: applications.filter((a) =>
      ["rejected", "not_proceeding", "quit"].includes(
        a.feedback?.[0]?.status || "",
      ),
    ).length,
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
      <Navbar user={user || undefined} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[
          { label: "Opportunities", href: `/${slug}/opportunities` },
          { label: opportunity?.title || "Opportunity", href: `/${slug}/opportunities/${oppId}` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Total</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-2 text-yellow-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Pending</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs">In Review</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.in_review}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <ArrowRight className="w-4 h-4" />
                  <span className="text-xs">Interview</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.interview}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Hired</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{stats.hired}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs">Rejected</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.rejected}
                </p>
              </div>
            </div>

            {formData.application_link && formData.application_link !== "apply" && (
              <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MousePointerClick className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">Application Link Clicks</p>
                      <p className="text-xs text-purple-600">Track how many people clicked the application link</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-900">{opportunity?.external_link_clicks || 0}</p>
                    <p className="text-xs text-purple-600">total clicks</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-purple-600" />
                  <a
                    href={formData.application_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleApplicationLinkClick}
                    className="text-sm text-purple-700 hover:text-purple-900 hover:underline truncate"
                  >
                    {formData.application_link}
                  </a>
                </div>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Applications
                </h2>
                <button
                  onClick={async () => {
                    if (!opportunity) return;
                    setIsAIScoreLoading(true);
                    try {
                      const scores = await compareApplicants(
                        opportunity.title,
                        opportunity.description,
                        opportunity.requirements,
                        applications,
                      );
                      setApplicantScores(scores);
                      setShowAIScoreModal(true);
                    } catch (err) {
                      console.error("AI comparison error:", err);
                    } finally {
                      setIsAIScoreLoading(false);
                    }
                  }}
                  disabled={isAIScoreLoading || applications.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isAIScoreLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  AI Compare
                </button>
              </div>

              <ApplicationList
                applications={applications}
                filteredApps={filteredApps}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                currentPage={currentPage}
                totalApps={totalApps}
                totalPages={totalPages}
                showAIScoreModal={showAIScoreModal}
                applicantScores={applicantScores}
                onSelectApp={setSelectedApp}
                onPageChange={fetchApplications}
                isLoading={isLoading}
              />
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit Opportunity
                </h2>
                <button
                  onClick={saveOpportunity}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>

              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Short Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none resize-none"
                    placeholder="Brief summary for listings..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Description
                  </label>
                  <RichTextEditor
                    content={formData.full_description}
                    onChange={(html) =>
                      setFormData({ ...formData, full_description: html })
                    }
                    placeholder="Detailed description with requirements, responsibilities..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Requirements
                    </label>
                    <RichTextEditor
                      content={formData.requirements}
                      onChange={(html) =>
                        setFormData({ ...formData, requirements: html })
                      }
                      placeholder="List requirements..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Benefits
                    </label>
                    <RichTextEditor
                      content={formData.benefits}
                      onChange={(html) =>
                        setFormData({ ...formData, benefits: html })
                      }
                      placeholder="List benefits..."
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                    >
                      <option value="">Select type</option>
                      {OPPORTUNITY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <MapPin className="w-4 h-4 inline mr-1" /> Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <DollarSign className="w-4 h-4 inline mr-1" /> Salary
                    </label>
                    <input
                      type="text"
                      value={formData.salary}
                      onChange={(e) =>
                        setFormData({ ...formData, salary: e.target.value })
                      }
                      placeholder="e.g. $50,000 - $80,000"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Clock className="w-4 h-4 inline mr-1" /> Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) =>
                        setFormData({ ...formData, expires_at: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Work Mode
                    </label>
                    <select
                      value={formData.work_mode}
                      onChange={(e) =>
                        setFormData({ ...formData, work_mode: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                    >
                      {WORK_MODES.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Employment Type
                    </label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employment_type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                    >
                      {EMPLOYMENT_TYPES.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Globe className="w-4 h-4 inline mr-1" /> Application Link
                    </label>
                    <input
                      type="url"
                      value={formData.application_link}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          application_link: e.target.value,
                        })
                      }
                      placeholder="https://... or 'apply' for internal form"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Mail className="w-4 h-4 inline mr-1" /> Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedApp && !showFeedbackModal && (
        <ApplicationDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdateStatus={(status) => openFeedbackModal(selectedApp, status)}
          isSending={isSendingFeedback}
        />
      )}

      {showFeedbackModal && selectedApp && (
        <FeedbackModal
          app={selectedApp}
          initialStatus={feedbackStatus}
          initialMessage={feedbackMessage}
          onSend={handleStatusUpdate}
          onClose={() => {
            setShowFeedbackModal(false);
            setFeedbackMessage("");
          }}
          isSending={isSendingFeedback}
        />
      )}

      {showAIScoreModal && (
        <AIScoreModal
          scores={applicantScores}
          onClose={() => setShowAIScoreModal(false)}
        />
      )}

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
