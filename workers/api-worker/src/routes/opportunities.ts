import { Env } from "../env";
import { jsonResp, supabaseHeaders, supabaseGet, supabaseInsert, supabaseUpdate, supabaseDelete, supabaseCount } from "../supabase";
import { verifyAuth } from "../auth";

// ── Opportunities CRUD ──────────────────────────────────────

export async function handleCreateOpportunity(request: Request, env: Env, origin: string | null) {
  const body = await request.json();
  const res = await supabaseInsert(env, "opportunities", body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 201, origin);
}

export async function handleUpdateOpportunity(request: Request, env: Env, oppId: string, origin: string | null) {
  const body = await request.json() as Record<string, unknown>;
  const res = await supabaseUpdate(env, "opportunities", `id=eq.${oppId}`, { ...body, updated_at: new Date().toISOString() });
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 200, origin);
}

export async function handleDeleteOpportunity(env: Env, oppId: string, origin: string | null) {
  const res = await supabaseDelete(env, "opportunities", `id=eq.${oppId}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp({ success: true }, 200, origin);
}

// ── Opportunity with Stats ──────────────────────────────────

export async function handleGetOpportunityWithStats(env: Env, oppId: string, origin: string | null) {
  const oppRes = await supabaseGet(env, "opportunities", `id=eq.${oppId}&select=*`);
  if (!oppRes.ok) return jsonResp({ error: await oppRes.text() }, 400, origin);
  const opps = await oppRes.json() as Record<string, unknown>[];
  if (!opps[0]) return jsonResp({ error: "Not found" }, 404, origin);

  const totalApps = await supabaseCount(env, "applications", `opportunity_id=eq.${oppId}`);

  return jsonResp({ ...opps[0], total_apps: totalApps }, 200, origin);
}

// ── Applications ────────────────────────────────────────────

export async function handleGetApplications(env: Env, oppId: string, url: URL, origin: string | null) {
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const status = url.searchParams.get("status") || "";
  const search = url.searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  let filters = `opportunity_id=eq.${oppId}`;
  let select = "*, feedback:applications_feedback(*)";

  if (status && status !== "all") {
    if (status === "pending") {
      filters += "&feedback.id=is.null";
    } else {
      filters += `&feedback.status=eq.${status}`;
    }
  }

  if (search) {
    const q = `%25${encodeURIComponent(search)}%25`;
    filters += `&or=(name.ilike.${q},email.ilike.${q},location.ilike.${q})`;
  }

  const res = await supabaseGet(env, "applications", `${filters}&select=${encodeURIComponent(select)}&order=created_at.desc&limit=${limit}&offset=${offset}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);

  const total = parseInt(res.headers.get("content-range")?.split("/")[1] || "0", 10);
  const data = await res.json();

  return jsonResp({ data, total }, 200, origin);
}

// ── Application Feedback ────────────────────────────────────

export async function handleUpdateApplicationFeedback(request: Request, env: Env, applicationId: string, origin: string | null) {
  const body = await request.json() as { status: string; feedback_message?: string; reviewer_id?: string };
  const { status, feedback_message, reviewer_id } = body;

  // Check for existing feedback
  const existingRes = await supabaseGet(env, "applications_feedback", `application_id=eq.${applicationId}&select=id&limit=1`);
  if (!existingRes.ok) return jsonResp({ error: await existingRes.text() }, 400, origin);
  const existing = await existingRes.json() as { id: string }[];

  if (existing[0]) {
    const res = await supabaseUpdate(env, "applications_feedback", `id=eq.${existing[0].id}`, { status, feedback_message, reviewer_id });
    if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
    const data = await res.json() as Record<string, unknown>[];
    return jsonResp(data[0], 200, origin);
  } else {
    const res = await supabaseInsert(env, "applications_feedback", { application_id: applicationId, status, feedback_message, reviewer_id });
    if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
    const data = await res.json() as Record<string, unknown>[];
    return jsonResp(data[0], 201, origin);
  }
}

// ── Tier / Subscription ─────────────────────────────────────

export async function handleUpdateCompanyTier(request: Request, env: Env, companyId: string, origin: string | null) {
  const body = await request.json() as Record<string, unknown>;
  const res = await supabaseUpdate(env, "featured_startups", `id=eq.${companyId}`, { ...body, updated_at: new Date().toISOString() });
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp({ success: true }, 200, origin);
}

// ── Increment Link Clicks ───────────────────────────────────

export async function handleIncrementLinkClicks(env: Env, oppId: string, origin: string | null) {
  // Use RPC like the original code
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/increment_external_link_clicks`, {
    method: "POST",
    headers: supabaseHeaders(env),
    body: JSON.stringify({ opp_id: oppId }),
  });
  if (!res.ok) {
    // Fallback: manual increment
    const getRes = await supabaseGet(env, "opportunities", `id=eq.${oppId}&select=external_link_clicks`);
    if (!getRes.ok) return jsonResp({ error: await getRes.text() }, 400, origin);
    const opps = await getRes.json() as { external_link_clicks: number }[];
    const current = opps[0]?.external_link_clicks || 0;
    const patchRes = await supabaseUpdate(env, "opportunities", `id=eq.${oppId}`, { external_link_clicks: current + 1, updated_at: new Date().toISOString() });
    if (!patchRes.ok) return jsonResp({ error: await patchRes.text() }, 400, origin);
    return jsonResp({ success: true }, 200, origin);
  }
  return jsonResp({ success: true }, 200, origin);
}

// ── Company Tier Info ───────────────────────────────────────

export async function handleGetCompanyTierInfo(env: Env, companyId: string, origin: string | null) {
  const res = await supabaseGet(env, "featured_startups", `id=eq.${companyId}&select=opportunity_tier,opportunity_listings_used,opportunity_listings_purchased,subscription_started_at,subscription_expires_at`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0] || null, 200, origin);
}

export async function handleGetOpportunityById(env: Env, oppId: string, origin: string | null) {
  const res = await supabaseGet(env, "opportunities", `id=eq.${oppId}&limit=1`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0] || null, 200, origin);
}

// ── Router ──────────────────────────────────────────────────

export async function routeOpportunities(request: Request, env: Env, url: URL, origin: string | null): Promise<Response | null> {
  const method = request.method;
  const path = url.pathname;

  // Opportunities CRUD
  if (path === "/api/opportunities" && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    return handleCreateOpportunity(request, env, origin);
  }
  if (path.match(/^\/api\/opportunities\/[^/]+$/) && method === "GET" && !path.includes("/with-stats") && !path.includes("/applications") && !path.includes("/click")) {
    const id = path.split("/")[3];
    return handleGetOpportunityById(env, id, origin);
  }
  if (path.match(/^\/api\/opportunities\/[^/]+$/) && method === "PATCH") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const id = path.split("/")[3];
    return handleUpdateOpportunity(request, env, id, origin);
  }
  if (path.match(/^\/api\/opportunities\/[^/]+$/) && method === "DELETE") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const id = path.split("/")[3];
    return handleDeleteOpportunity(env, id, origin);
  }

  // Opportunity with stats
  if (path.match(/^\/api\/opportunities\/[^/]+\/with-stats$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetOpportunityWithStats(env, id, origin);
  }

  // Applications
  if (path.match(/^\/api\/opportunities\/[^/]+\/applications$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetApplications(env, id, url, origin);
  }

  // Application feedback
  if (path.match(/^\/api\/applications\/[^/]+\/feedback$/) && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const appId = path.split("/")[3];
    return handleUpdateApplicationFeedback(request, env, appId, origin);
  }

  // Increment link clicks
  if (path.match(/^\/api\/opportunities\/[^/]+\/click$/) && method === "POST") {
    const id = path.split("/")[3];
    return handleIncrementLinkClicks(env, id, origin);
  }

  // Tier management
  if (path.match(/^\/api\/companies\/[^/]+\/tier$/) && method === "GET") {
    const companyId = path.split("/")[3];
    return handleGetCompanyTierInfo(env, companyId, origin);
  }
  if (path.match(/^\/api\/companies\/[^/]+\/tier$/) && method === "PATCH") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const companyId = path.split("/")[3];
    return handleUpdateCompanyTier(request, env, companyId, origin);
  }

  return null;
}
