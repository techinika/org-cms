"use client";

import { useState, useEffect, useMemo, useDeferredValue, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Loader2,
  Users,
  Clock,
  MessageSquare,
  ArrowRight,
  Sparkles,
  CheckCircle,
  XCircle,
  Briefcase,
} from "lucide-react";
import { Opportunity, Application } from "@/types/company";
import {
  getOpportunityById,
  getOpportunityApplications,
  workerFetch,
} from "@/lib/worker";
import { compareApplicants, ApplicantScore } from "@/lib/ai";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import ApplicationList from "@/components/opportunities/ApplicationList";
import ApplicationDetailModal from "@/components/opportunities/ApplicationDetailModal";
import FeedbackModal from "@/components/opportunities/FeedbackModal";
import AIScoreModal from "@/components/opportunities/AIScoreModal";
import { getDefaultEmailMessage, APPLICATION_PROGRESS_STAGES, getProgressLabel } from "@/components/opportunities/shared";
import { useToast } from "@/components/ui/Toast";

const PAGE_SIZE = 50;

export default function OpportunityApplicationsPage({
  params,
}: {
  params: Promise<{ slug: string; "opp-id": string }>;
}) {
  const { slug, "opp-id": oppId } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [totalApps, setTotalApps] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("in_review");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [isAIScoreLoading, setIsAIScoreLoading] = useState(false);
  const [applicantScores, setApplicantScores] = useState<ApplicantScore[]>([]);
  const [showAIScoreModal, setShowAIScoreModal] = useState(false);

  const totalPages = Math.ceil(totalApps / PAGE_SIZE);
  const deferredSearch = useDeferredValue(searchQuery);
  const deferredStatus = useDeferredValue(statusFilter);

  const fetchOpportunity = useCallback(async () => {
    const { data, error } = await getOpportunityById(oppId);
    if (error || !data) {
      setError("Opportunity not found");
      setIsLoading(false);
      return;
    }

    setOpportunity(data);
  }, [oppId]);

  const fetchApplications = useCallback(async (page: number) => {
    setIsLoading(true);
    const result = await getOpportunityApplications(
      oppId, page, PAGE_SIZE,
      { status: deferredStatus === "all" ? undefined : deferredStatus, search: deferredSearch || undefined }
    );
    setApplications(result.data || []);
    setTotalApps(result.total);
    setCurrentPage(page);
    setIsLoading(false);
  }, [oppId, deferredStatus, deferredSearch]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchOpportunity();
    }
  }, [authLoading, user, fetchOpportunity]);

  useEffect(() => {
    if (opportunity) {
      fetchApplications(1);
    }
  }, [deferredStatus, deferredSearch, fetchApplications, opportunity]);

  const openFeedbackModal = (app: Application, status: string) => {
    setSelectedApp(app);
    setFeedbackStatus(status);
    setFeedbackMessage(
      getDefaultEmailMessage(status, app.name || app.company_name || "Applicant")
    );
    setShowFeedbackModal(true);
  };

  const handleStatusUpdate = async (appId: string, newStatus: string, message?: string) => {
    setIsSendingFeedback(true);
    await workerFetch(`/api/applications/${appId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ status: newStatus, feedback_message: message, reviewer_id: user?.id }),
    });

    const app = applications.find(a => a.id === appId);
    const recipientEmail = app?.email || app?.tender_email;
    if (recipientEmail && message) {
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: recipientEmail,
            subject: getProgressLabel(newStatus),
            message,
            applicantName: app?.name || app?.company_name,
            opportunityTitle: opportunity?.title,
          }),
        });
      } catch {
        // Email failure is non-critical
      }
    }

    const result = await getOpportunityApplications(
      oppId, currentPage, PAGE_SIZE,
      { status: deferredStatus === "all" ? undefined : deferredStatus, search: deferredSearch || undefined }
    );
    setApplications(result.data || []);
    setTotalApps(result.total);
    if (selectedApp?.id === appId) {
      const updated = result.data?.find(a => a.id === appId);
      if (updated) setSelectedApp(updated);
    }
    setIsSendingFeedback(false);
    setShowFeedbackModal(false);
    setFeedbackMessage("");
  };

  const filteredApps = useMemo(() => {
    if (showAIScoreModal) {
      return applications.filter(app => {
        const scored = applicantScores.find(s => s.id === app.id);
        if (scored && deferredStatus !== "all") {
          if (deferredStatus === "pending") return scored.score < 50;
          if (deferredStatus === "in_review") return scored.score >= 50 && scored.score < 70;
          if (deferredStatus === "interview_pending") return scored.score >= 70;
          if (deferredStatus === "rejected") return scored.score < 30;
        }
        const q = deferredSearch.toLowerCase();
        return (
          app.name?.toLowerCase().includes(q) ||
          app.email?.toLowerCase().includes(q) ||
          app.location?.toLowerCase().includes(q) ||
          app.company_name?.toLowerCase().includes(q)
        );
      });
    }
    return applications;
  }, [applications, showAIScoreModal, applicantScores, deferredStatus, deferredSearch]);

  if (authLoading || (isLoading && !opportunity)) {
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
        <Link href={`/${slug}/opportunities`} className="text-[#3182ce] hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: "Opportunities", href: `/${slug}/opportunities` },
            { label: opportunity?.title || "Opportunity", href: `/${slug}/opportunities/${oppId}` },
            { label: "Applications", href: `/${slug}/opportunities/${oppId}/applications` },
          ]}
        />

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{opportunity.title}</h1>
                <p className="text-sm text-gray-500">{opportunity.type} &bull; {opportunity.location}</p>
              </div>
            </div>
            <Link
              href={`/${slug}/opportunities/${oppId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Back to Overview
            </Link>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Total</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{totalApps}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-2 text-yellow-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Pending</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {applications.filter(a => !a.feedback?.[0]).length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs">In Review</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {applications.filter(a => a.feedback?.[0]?.status === "in_review").length}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <ArrowRight className="w-4 h-4" />
                  <span className="text-xs">Interview</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {applications.filter(a => a.feedback?.[0]?.status === "interview_pending").length}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Hired</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {applications.filter(a =>
                    ["hired", "started_job", "started_internship"].includes(a.feedback?.[0]?.status || "")
                  ).length}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs">Rejected</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {applications.filter(a =>
                    ["rejected", "not_proceeding", "quit"].includes(a.feedback?.[0]?.status || "")
                  ).length}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Applications</h2>
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
    </div>
  );
}
