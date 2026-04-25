export const APPLICATION_PROGRESS_STAGES = [
  { key: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { key: "in_review", label: "In Review", color: "bg-blue-100 text-blue-700" },
  { key: "interview_pending", label: "Interview Pending", color: "bg-purple-100 text-purple-700" },
  { key: "technical_exam_pending", label: "Technical Exam", color: "bg-indigo-100 text-indigo-700" },
  { key: "contract_signing_pending", label: "Contract Signing", color: "bg-orange-100 text-orange-700" },
  { key: "hired", label: "Hired", color: "bg-green-100 text-green-700" },
  { key: "started_job", label: "Started Job", color: "bg-emerald-100 text-emerald-700" },
  { key: "started_internship", label: "Started Internship", color: "bg-emerald-100 text-emerald-700" },
  { key: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
  { key: "not_proceeding", label: "Not Proceeding", color: "bg-gray-100 text-gray-700" },
  { key: "quit", label: "Quit", color: "bg-gray-100 text-gray-700" },
];

export function getProgressLabel(status: string | null | undefined): string {
  const stage = APPLICATION_PROGRESS_STAGES.find((s) => s.key === status);
  return stage?.label || "Pending";
}

export function getProgressColor(status: string | null | undefined): string {
  const stage = APPLICATION_PROGRESS_STAGES.find((s) => s.key === status);
  return stage?.color || "bg-yellow-100 text-yellow-700";
}

export function getDefaultEmailMessage(status: string, name: string): string {
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
  return messages[status] || `Dear ${name},\n\nWe would like to update you on your application status.\n\nBest regards`;
}