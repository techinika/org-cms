export interface ApplicantScore {
  id: string;
  name: string | null;
  email: string | null;
  tender_email: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  score: number;
  reasoning: string;
}

interface ApplicationInput {
  id: string;
  name: string | null;
  email: string | null;
  tender_email: string | null;
  cover_letter: string | null;
  resume_url: string | null;
}

const AI_WORKER_URL = process.env.NEXT_PUBLIC_AI_WORKER_URL || "http://localhost:8787";

export async function compareApplicants(
  opportunityTitle: string,
  opportunityDescription: string,
  requirements: string | null,
  applications: ApplicationInput[],
): Promise<ApplicantScore[]> {
  const res = await fetch(`${AI_WORKER_URL}/api/ai/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      opportunityTitle,
      opportunityDescription,
      requirements,
      applications,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `AI worker returned ${res.status}`);
  }

  const data = await res.json() as { scores: ApplicantScore[] };
  return data.scores || [];
}
