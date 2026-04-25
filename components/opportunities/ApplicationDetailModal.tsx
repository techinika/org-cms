"use client";

import { Application } from "@/types/company";
import {
  X,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { getProgressLabel, getProgressColor } from "./shared";

interface ApplicationDetailModalProps {
  app: Application;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
  isSending: boolean;
}

export default function ApplicationDetailModal({
  app,
  onClose,
  onUpdateStatus,
  isSending,
}: ApplicationDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Application Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <p className="font-medium text-gray-900">{app.name || app.company_name || "N/A"}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <p className="text-gray-900">{app.email || app.tender_email || "N/A"}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone</label>
                <p className="text-gray-900">{app.phone || "N/A"}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Location</label>
                <p className="text-gray-900">{app.location || "N/A"}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <span className={`inline-block text-xs px-2 py-1 rounded-full ${getProgressColor(app.feedback?.[0]?.status)}`}>
                  {getProgressLabel(app.feedback?.[0]?.status)}
                </span>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Applied</label>
                <p className="text-gray-900">{app.created_at ? new Date(app.created_at).toLocaleString() : "N/A"}</p>
              </div>
            </div>

            {app.cover_letter && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cover Letter</label>
                <p className="text-gray-700 whitespace-pre-wrap">{app.cover_letter}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {app.resume_url && (
                <a
                  href={app.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-[#3182ce]" />
                  <div>
                    <p className="font-medium text-gray-900">Resume</p>
                    <p className="text-xs text-gray-500">View in browser</p>
                  </div>
                </a>
              )}
              {app.proposal_url && (
                <a
                  href={app.proposal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Proposal</p>
                    <p className="text-xs text-gray-500">View in browser</p>
                  </div>
                </a>
              )}
            </div>

            {app.supporting_docs && app.supporting_docs.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-2">Supporting Documents</label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {app.supporting_docs.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-[#3182ce] truncate">
                        {doc.split("/").pop() || `Document ${idx + 1}`}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {app.portfolio_links && app.portfolio_links.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-2">Portfolio Links</label>
                <div className="space-y-2">
                  {app.portfolio_links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#3182ce] hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {app.feedback && app.feedback.length > 0 && app.feedback[0].feedback_message && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-xs text-gray-500 mb-1">Reviewer Feedback</label>
                <p className="text-gray-700 whitespace-pre-wrap">{app.feedback[0].feedback_message}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Update Application Progress</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => onUpdateStatus("in_review")}
              className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              In Review
            </button>
            <button
              onClick={() => onUpdateStatus("interview_pending")}
              className="px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
            >
              Interview
            </button>
            <button
              onClick={() => onUpdateStatus("technical_exam_pending")}
              className="px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              Tech Exam
            </button>
            <button
              onClick={() => onUpdateStatus("contract_signing_pending")}
              className="px-3 py-2 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
            >
              Contract
            </button>
            <button
              onClick={() => onUpdateStatus("hired")}
              className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
            >
              Hire
            </button>
            <button
              onClick={() => onUpdateStatus("rejected")}
              className="px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}