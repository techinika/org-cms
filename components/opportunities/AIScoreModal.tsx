"use client";

import { X, Sparkles } from "lucide-react";
import { ApplicantScore } from "@/lib/ai";

interface AIScoreModalProps {
  scores: ApplicantScore[];
  onClose: () => void;
}

export default function AIScoreModal({ scores, onClose }: AIScoreModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Applicant Rankings</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-gray-600 mb-4">
            AI has analyzed each applicant based on the job requirements and cover letters.
          </p>

          <div className="space-y-4">
            {scores.map((app, idx) => (
              <div key={app.id} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        idx === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : idx === 1
                          ? "bg-gray-100 text-gray-700"
                          : idx === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{app.name || "Anonymous"}</p>
                      <p className="text-sm text-gray-500">{app.email || app.tender_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`text-2xl font-bold ${
                        app.score >= 80
                          ? "text-green-600"
                          : app.score >= 60
                          ? "text-blue-600"
                          : app.score >= 40
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {app.score}%
                    </div>
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 pl-11">{app.reasoning}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}