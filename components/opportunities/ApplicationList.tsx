"use client";

import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Users,
} from "lucide-react";
import { Application } from "@/types/company";
import { ApplicantScore } from "@/lib/ai";
import { getProgressLabel, getProgressColor } from "./shared";

const APPLICATIONS_PER_PAGE = 50;

interface ApplicationListProps {
  applications: Application[];
  filteredApps: Application[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  currentPage: number;
  totalApps: number;
  totalPages: number;
  showAIScoreModal: boolean;
  applicantScores: ApplicantScore[];
  onSelectApp: (app: Application) => void;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export default function ApplicationList({
  applications,
  filteredApps,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  currentPage,
  totalApps,
  totalPages,
  showAIScoreModal,
  applicantScores,
  onSelectApp,
  onPageChange,
  isLoading,
}: ApplicationListProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="interview_pending">Interview Pending</option>
          <option value="technical_exam_pending">Technical Exam</option>
          <option value="contract_signing_pending">Contract Signing</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin mx-auto" />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No applications found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filteredApps.map((app) => {
              const score = applicantScores.find((s) => s.id === app.id);
              return (
                <div
                  key={app.id}
                  className="p-4 border border-gray-200 rounded-xl hover:border-[#3182ce]/30 transition-colors cursor-pointer"
                  onClick={() => onSelectApp(app)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {app.name || app.company_name || "Anonymous"}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {app.email || app.tender_email}
                      </p>
                      {app.location && (
                        <p className="text-xs text-gray-400 mt-1">{app.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {app.resume_url && (
                        <a
                          href={app.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3182ce] hover:underline text-sm flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-4 h-4" />
                          Resume
                        </a>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getProgressColor(
                          app.feedback?.[0]?.status
                        )}`}
                      >
                        {getProgressLabel(app.feedback?.[0]?.status)}
                      </span>
                      {showAIScoreModal && score && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            score.score >= 80
                              ? "bg-green-100 text-green-700"
                              : score.score >= 60
                              ? "bg-blue-100 text-blue-700"
                              : score.score >= 40
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {score.score}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * APPLICATIONS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * APPLICATIONS_PER_PAGE, totalApps)} of {totalApps}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}