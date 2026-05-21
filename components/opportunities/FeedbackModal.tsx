"use client";

import { useState } from "react";
import {
  X,
  Send,
  Mail,
  Loader2,
} from "lucide-react";
import { getProgressLabel } from "./shared";

interface FeedbackModalProps {
  app: { id: string; name: string | null; company_name: string | null; email: string | null; tender_email: string | null };
  initialStatus: string;
  initialMessage: string;
  onSend: (status: string, message: string) => void;
  onClose: () => void;
  isSending: boolean;
}

export default function FeedbackModal({
  app,
  initialStatus,
  initialMessage,
  onSend,
  onClose,
  isSending,
}: FeedbackModalProps) {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState(initialMessage);

  const getDefaultMessage = (newStatus: string, name: string): string => {
    const messages: Record<string, string> = {
      in_review: `Dear ${name},\n\nThank you for your application. We are currently reviewing your submission and will get back to you soon.\n\nBest regards`,
      interview_pending: `Dear ${name},\n\nCongratulations! Your application has been shortlisted. We would like to invite you for an interview. Please let us know your availability.\n\nBest regards`,
      technical_exam_pending: `Dear ${name},\n\nGreat progress! You have advanced to the technical assessment stage. Please check your email for further instructions.\n\nBest regards`,
      contract_signing_pending: `Dear ${name},\n\nWe are pleased to offer you the position! Please review the attached contract and let us know if you have any questions.\n\nBest regards`,
      hired: `Dear ${name},\n\nCongratulations! We are delighted to officially welcome you to our team. Please find your onboarding documents attached.\n\nBest regards`,
      started_job: `Dear ${name},\n\nWelcome aboard! We're excited to have you join us. Your start date has been confirmed.\n\nBest regards`,
      started_internship: `Dear ${name},\n\nWelcome to your internship! We look forward to working with you.\n\nBest regards`,
      rejected: `Dear ${name},\n\nThank you for your interest in this position. After careful consideration, we have decided to move forward with other candidates. We encourage you to apply for future openings.\n\nBest regards`,
      not_proceeding: `Dear ${name},\n\nWe regret to inform you that this position is no longer available. We encourage you to apply for future openings.\n\nBest regards`,
      quit: `Dear ${name},\n\nWe have received your resignation. We wish you all the best in your future endeavors.\n\nBest regards`,
    };
    return messages[newStatus] || `Dear ${name},\n\nWe would like to update you on your application status.\n\nBest regards`;
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setMessage(getDefaultMessage(newStatus, app.name || app.company_name || "Applicant"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Update Progress</h3>
            <p className="text-sm text-gray-500">{getProgressLabel(status)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Send Email to Applicant</label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="input-base bg-white"
            >
              <option value="in_review">In Review</option>
              <option value="interview_pending">Interview Pending</option>
              <option value="technical_exam_pending">Technical Exam</option>
              <option value="contract_signing_pending">Contract Signing</option>
              <option value="hired">Hired</option>
              <option value="started_job">Started Job</option>
              <option value="started_internship">Started Internship</option>
              <option value="rejected">Rejected</option>
              <option value="not_proceeding">Not Proceeding</option>
              <option value="quit">Quit</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="input-base resize-none"
              placeholder="Enter personalized message..."
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Mail className="w-4 h-4" />
            <span>Email will be sent to: {app.email || app.tender_email}</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSend(status, message)}
            disabled={isSending}
            className="px-4 py-2 text-sm font-medium text-white bg-[#3182ce] hover:bg-[#2c5cb8] rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Update & Send Email
          </button>
        </div>
      </div>
    </div>
  );
}