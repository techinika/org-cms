import { Env } from "../env";
import { supabaseGet } from "../supabase";
import { verifyAuth } from "../auth";

interface ApplicationInput {
  id: string;
  name: string | null;
  email: string | null;
  tender_email: string | null;
  cover_letter: string | null;
  resume_url: string | null;
}

interface ApplicantScore {
  id: string;
  name: string | null;
  email: string | null;
  tender_email: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  score: number;
  reasoning: string;
}

async function scoreSingleApplicant(
  env: Env,
  opportunityTitle: string,
  opportunityDescription: string,
  requirements: string | null,
  app: ApplicationInput,
): Promise<ApplicantScore> {
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
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${errText}`);
    }

    const data = await res.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

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

    return {
      id: app.id,
      name: app.name,
      email: app.email,
      tender_email: app.tender_email,
      cover_letter: app.cover_letter,
      resume_url: app.resume_url,
      score,
      reasoning,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      id: app.id,
      name: app.name,
      email: app.email,
      tender_email: app.tender_email,
      cover_letter: app.cover_letter,
      resume_url: app.resume_url,
      score: 50,
      reasoning: `Analysis failed: ${errMsg}`,
    };
  }
}

const CONCURRENCY_LIMIT = 5;

export async function handleCompareApplicants(
  request: Request,
  env: Env,
  origin: string | null,
): Promise<Response> {
  const jsonResp = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Credentials": "true",
      },
    });

  if (!(await verifyAuth(request, env))) {
    return jsonResp({ error: "Unauthorized" }, 401);
  }

  try {
    const body = (await request.json()) as {
      opportunityId?: string;
      opportunityTitle?: string;
      opportunityDescription?: string;
      requirements?: string | null;
      applications?: ApplicationInput[];
    };

    const { opportunityId, ...rest } = body;
    let { opportunityTitle, opportunityDescription, requirements, applications } = rest;

    // If opportunityId provided, fetch opportunity details and applications from Supabase
    if (opportunityId && (!opportunityTitle || !applications?.length)) {
      const oppRes = await supabaseGet(env, "opportunities", `id=eq.${opportunityId}&select=title,description,requirements`);
      if (oppRes.ok) {
        const opps = await oppRes.json() as { title: string; description: string; requirements: string | null }[];
        if (opps[0]) {
          opportunityTitle = opportunityTitle || opps[0].title;
          opportunityDescription = opportunityDescription || opps[0].description;
          requirements = requirements ?? opps[0].requirements;
        }
      }

      if (!applications?.length) {
        const appsRes = await supabaseGet(env, "applications", `opportunity_id=eq.${opportunityId}&select=id,name,email,tender_email,cover_letter,resume_url`);
        if (appsRes.ok) {
          applications = await appsRes.json() as ApplicationInput[];
        }
      }
    }

    if (!opportunityTitle || !opportunityDescription || !applications?.length) {
      return jsonResp({ error: "Missing required fields: opportunityTitle, opportunityDescription, applications" }, 400);
    }

    const results: ApplicantScore[] = [];
    for (let i = 0; i < applications.length; i += CONCURRENCY_LIMIT) {
      const batch = applications.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(
        batch.map(app =>
          scoreSingleApplicant(env, opportunityTitle!, opportunityDescription!, requirements || null, app)
        ),
      );
      results.push(...batchResults);
    }

    results.sort((a, b) => b.score - a.score);

    return jsonResp({ scores: results });
  } catch (error) {
    console.error("AI compare error:", error);
    return jsonResp({ error: "Internal server error" }, 500);
  }
}
