import { puter } from "@heyputer/puter.js";

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

export async function compareApplicants(
  opportunityTitle: string,
  opportunityDescription: string,
  requirements: string | null,
  applications: Array<{
    id: string;
    name: string | null;
    email: string | null;
    tender_email: string | null;
    cover_letter: string | null;
    resume_url: string | null;
  }>
): Promise<ApplicantScore[]> {
  const scoredApps: ApplicantScore[] = [];

  for (const app of applications) {
    const prompt = `You are a hiring assistant. Compare the following job applicant to the job requirements and provide a compatibility score (0-100) and brief reasoning.

Job Title: ${opportunityTitle}
Job Description: ${opportunityDescription}
Job Requirements: ${requirements || "Not specified"}

Applicant Name: ${app.name || "Unknown"}
Applicant Cover Letter: ${app.cover_letter || "Not provided"}

Respond in this exact JSON format:
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation of the score>"
}`;

    try {
      const response = await puter.ai.chat(prompt);
      const resp: Record<string, unknown> = response as unknown as Record<string, unknown>;
      const text = String((resp?.message as Record<string, unknown>)?.content || resp?.text || response || "");
      
      const scoreMatch = text.match(/"score"\s*:\s*(\d+)/);
      const reasoningMatch = text.match(/"reasoning"\s*:\s*"([^"]+)"/);
      
      let score = 50;
      let reasoning = "Unable to analyze";
      
      if (scoreMatch) {
        score = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));
      }
      if (reasoningMatch) {
        reasoning = reasoningMatch[1];
      } else if (text.includes("score")) {
        const lines = text.split("\n").filter(l => l.includes("score"));
        if (lines.length > 0) {
          const numMatch = lines[0].match(/(\d+)/);
          if (numMatch) {
            score = parseInt(numMatch[1]);
          }
          reasoning = text.split("\n").slice(1).join(" ").substring(0, 200);
        }
      }
      
      scoredApps.push({
        id: app.id,
        name: app.name,
        email: app.email,
        tender_email: app.tender_email,
        cover_letter: app.cover_letter,
        resume_url: app.resume_url,
        score,
        reasoning,
      });
    } catch (error) {
      console.error("AI comparison error:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      scoredApps.push({
        id: app.id,
        name: app.name,
        email: app.email,
        tender_email: app.tender_email,
        cover_letter: app.cover_letter,
        resume_url: app.resume_url,
        score: 50,
        reasoning: `Analysis failed: ${errMsg}`,
      });
    }
  }

  return scoredApps.sort((a, b) => b.score - a.score);
}