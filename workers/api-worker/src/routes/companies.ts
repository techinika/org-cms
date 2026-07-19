import { Env } from "../env";
import { jsonResp, supabaseGet, supabaseInsert, supabaseUpdate, supabaseDelete } from "../supabase";
import { verifyAuth } from "../auth";

// ── Company Reads ────────────────────────────────────────────

export async function handleGetCompanyBySlug(env: Env, slug: string, origin: string | null) {
  const res = await supabaseGet(env, "featured_startups", `slug=eq.${slug}&limit=1`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0] || null, 200, origin);
}

export async function handleGetCompanyById(env: Env, companyId: string, origin: string | null) {
  const res = await supabaseGet(env, "featured_startups", `id=eq.${companyId}&limit=1`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0] || null, 200, origin);
}

export async function handleGetAllCompanies(env: Env, origin: string | null) {
  const res = await supabaseGet(env, "featured_startups", "order=created_at.desc");
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleSearchCompanies(env: Env, url: URL, origin: string | null) {
  const q = url.searchParams.get("q") || "";
  const res = await supabaseGet(env, "featured_startups", `name=ilike.*${encodeURIComponent(q)}*&limit=10`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleGetCompanyEvents(env: Env, companyId: string, origin: string | null) {
  const res = await supabaseGet(env, "events", `organizer_id=eq.${companyId}&order=start_date.asc`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleGetCompanyOpportunities(env: Env, companyId: string, origin: string | null) {
  const res = await supabaseGet(env, "opportunities", `company_id=eq.${companyId}&order=created_at.desc`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

// ── Company Writes ───────────────────────────────────────────

export async function handleCreateCompany(request: Request, env: Env, origin: string | null) {
  const body = await request.json();
  const res = await supabaseInsert(env, "featured_startups", body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 201, origin);
}

export async function handleUpdateCompany(request: Request, env: Env, companyId: string, origin: string | null) {
  const body = await request.json() as Record<string, unknown>;
  const res = await supabaseUpdate(env, "featured_startups", `id=eq.${companyId}`, { ...body, updated_at: new Date().toISOString() });
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 200, origin);
}

export async function handleDeleteCompany(env: Env, companyId: string, origin: string | null) {
  const res = await supabaseDelete(env, "featured_startups", `id=eq.${companyId}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp({ success: true }, 200, origin);
}

export async function handleClaimCompany(request: Request, env: Env, origin: string | null) {
  const body = await request.json() as { user_id: string; company_id: string; added_by: string };
  const insertRes = await supabaseInsert(env, "user_company", {
    user_id: body.user_id,
    company_id: body.company_id,
    role: "manager",
    status: "confirmation_pending",
    added_by: body.added_by,
  });
  if (!insertRes.ok) return jsonResp({ error: await insertRes.text() }, 400, origin);
  await supabaseUpdate(env, "featured_startups", `id=eq.${body.company_id}`, { claimed: true });
  const data = await insertRes.json() as Record<string, unknown>[];
  return jsonResp(data[0], 201, origin);
}

// ── User Company Reads ───────────────────────────────────────

export async function handleGetUserCompanies(env: Env, userId: string, origin: string | null) {
  const select = "*, company:featured_startups(*)";
  const res = await supabaseGet(env, "user_company", `user_id=eq.${userId}&select=${encodeURIComponent(select)}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleGetUserPendingRequests(env: Env, userId: string, origin: string | null) {
  const select = "*, company:featured_startups(*)";
  const res = await supabaseGet(env, "user_company", `user_id=eq.${userId}&status=eq.confirmation_pending&select=${encodeURIComponent(select)}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleGetUserPendingRequestByCompany(env: Env, userId: string, companyId: string, origin: string | null) {
  const res = await supabaseGet(env, "user_company", `user_id=eq.${userId}&company_id=eq.${companyId}&status=eq.confirmation_pending&limit=1`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0] || null, 200, origin);
}

export async function handleGetUserCompanyById(env: Env, userId: string, companyId: string, origin: string | null) {
  const select = "*, company:featured_startups(*)";
  const res = await supabaseGet(env, "user_company", `user_id=eq.${userId}&company_id=eq.${companyId}&select=${encodeURIComponent(select)}&limit=1`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0] || null, 200, origin);
}

export async function handleRemoveUserCompany(env: Env, userId: string, companyId: string, origin: string | null) {
  const res = await supabaseDelete(env, "user_company", `user_id=eq.${userId}&company_id=eq.${companyId}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp({ success: true }, 200, origin);
}

// ── Company Users ────────────────────────────────────────────

export async function handleGetCompanyUsers(env: Env, companyId: string, origin: string | null) {
  const select = "*, author:authors!user_company_user_id_fkey1(id, name, image_ref)";
  const res = await supabaseGet(env, "user_company", `company_id=eq.${companyId}&select=${encodeURIComponent(select)}&order=created_at.desc`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleAddCompanyUser(request: Request, env: Env, companyId: string, origin: string | null) {
  const body = await request.json() as { user_email?: string; user_id?: string; role: string; added_by: string; status?: string };

  let userId = body.user_id;
  if (!userId && body.user_email) {
    const userRes = await supabaseGet(env, "authors", `email=eq.${body.user_email}&select=id&limit=1`);
    if (!userRes.ok) return jsonResp({ error: await userRes.text() }, 400, origin);
    const users = await userRes.json() as { id: string }[];
    if (!users[0]) return jsonResp({ error: "User not found with this email" }, 404, origin);
    userId = users[0].id;
  }
  if (!userId) return jsonResp({ error: "user_id or user_email required" }, 400, origin);

  const res = await supabaseInsert(env, "user_company", {
    company_id: companyId,
    user_id: userId,
    role: body.role,
    status: body.status || "confirmation_pending",
    added_by: body.added_by,
  });
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 201, origin);
}

export async function handleUpdateCompanyUser(request: Request, env: Env, userCompanyId: string, origin: string | null) {
  const body = await request.json() as Record<string, unknown>;
  const res = await supabaseUpdate(env, "user_company", `id=eq.${userCompanyId}`, { ...body, updated_at: new Date().toISOString() });
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 200, origin);
}

export async function handleDeleteCompanyUser(env: Env, userCompanyId: string, origin: string | null) {
  const res = await supabaseDelete(env, "user_company", `id=eq.${userCompanyId}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp({ success: true }, 200, origin);
}

// ── Industries ───────────────────────────────────────────────

export async function handleGetAllIndustries(env: Env, origin: string | null) {
  const res = await supabaseGet(env, "industries", "order=name");
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleGetCompanyIndustries(env: Env, companyId: string, origin: string | null) {
  const select = "industry:industries(*)";
  const res = await supabaseGet(env, "company_industries", `company_id=eq.${companyId}&select=${encodeURIComponent(select)}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as { industry: { id: string } }[];
  const industryIds = data.map(d => d.industry?.id).filter(Boolean);
  return jsonResp(industryIds, 200, origin);
}

export async function handleSetCompanyIndustries(request: Request, env: Env, companyId: string, origin: string | null) {
  const body = await request.json() as { industry_ids: string[] };
  await supabaseDelete(env, "company_industries", `company_id=eq.${companyId}`);
  if (body.industry_ids.length === 0) return jsonResp({ success: true }, 200, origin);
  const inserts = body.industry_ids.map(industry_id => ({ company_id: companyId, industry_id }));
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/company_industries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
    body: JSON.stringify(inserts),
  });
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp({ success: true }, 200, origin);
}

// ── Router ───────────────────────────────────────────────────

export async function routeCompanies(request: Request, env: Env, url: URL, origin: string | null): Promise<Response | null> {
  const method = request.method;
  const path = url.pathname;

  // Company by slug
  if (path.match(/^\/api\/companies\/by-slug\/[^/]+$/) && method === "GET") {
    const slug = path.split("/")[5];
    return handleGetCompanyBySlug(env, slug, origin);
  }

  // Company by ID
  if (path.match(/^\/api\/companies\/[^/]+$/) && method === "GET" && !path.includes("/tier") && !path.includes("/events") && !path.includes("/opportunities") && !path.includes("/users") && !path.includes("/industries")) {
    const id = path.split("/")[3];
    return handleGetCompanyById(env, id, origin);
  }

  // All companies
  if (path === "/api/companies" && method === "GET") return handleGetAllCompanies(env, origin);
  if (path === "/api/companies" && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    return handleCreateCompany(request, env, origin);
  }

  // Search companies
  if (path === "/api/companies/search" && method === "GET") return handleSearchCompanies(env, url, origin);

  // Company events
  if (path.match(/^\/api\/companies\/[^/]+\/events$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetCompanyEvents(env, id, origin);
  }

  // Company opportunities
  if (path.match(/^\/api\/companies\/[^/]+\/opportunities$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetCompanyOpportunities(env, id, origin);
  }

  // Update company
  if (path.match(/^\/api\/companies\/[^/]+$/) && method === "PATCH") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const id = path.split("/")[3];
    return handleUpdateCompany(request, env, id, origin);
  }

  // Delete company
  if (path.match(/^\/api\/companies\/[^/]+$/) && method === "DELETE") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const id = path.split("/")[3];
    return handleDeleteCompany(env, id, origin);
  }

  // Claim company
  if (path === "/api/companies/claim" && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    return handleClaimCompany(request, env, origin);
  }

  // User companies
  if (path.match(/^\/api\/users\/[^/]+\/companies$/) && method === "GET") {
    const userId = path.split("/")[3];
    return handleGetUserCompanies(env, userId, origin);
  }

  // User pending requests
  if (path.match(/^\/api\/users\/[^/]+\/pending-requests$/) && method === "GET") {
    const userId = path.split("/")[3];
    return handleGetUserPendingRequests(env, userId, origin);
  }

  // User pending request by company
  if (path.match(/^\/api\/users\/[^/]+\/pending-request\/[^/]+$/) && method === "GET") {
    const parts = path.split("/");
    return handleGetUserPendingRequestByCompany(env, parts[3], parts[5], origin);
  }

  // User company by ID
  if (path.match(/^\/api\/users\/[^/]+\/company\/[^/]+$/) && method === "GET") {
    const parts = path.split("/");
    return handleGetUserCompanyById(env, parts[3], parts[5], origin);
  }

  // Remove user company
  if (path.match(/^\/api\/users\/[^/]+\/companies\/[^/]+$/) && method === "DELETE") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const parts = path.split("/");
    return handleRemoveUserCompany(env, parts[3], parts[5], origin);
  }

  // Company users
  if (path.match(/^\/api\/companies\/[^/]+\/users$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetCompanyUsers(env, id, origin);
  }
  if (path.match(/^\/api\/companies\/[^/]+\/users$/) && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const id = path.split("/")[3];
    return handleAddCompanyUser(request, env, id, origin);
  }
  // Direct user company update/delete by userCompanyId
  if (path.match(/^\/api\/companies\/_user\/[^/]+$/) && method === "PATCH") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const userCompanyId = path.split("/")[4];
    return handleUpdateCompanyUser(request, env, userCompanyId, origin);
  }
  if (path.match(/^\/api\/companies\/_user\/[^/]+$/) && method === "DELETE") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const userCompanyId = path.split("/")[4];
    return handleDeleteCompanyUser(env, userCompanyId, origin);
  }
  // Company users update/delete by companyId/userId
  if (path.match(/^\/api\/companies\/[^/]+\/users\/[^/]+$/) && method === "PATCH") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const userCompanyId = path.split("/")[5];
    return handleUpdateCompanyUser(request, env, userCompanyId, origin);
  }
  if (path.match(/^\/api\/companies\/[^/]+\/users\/[^/]+$/) && method === "DELETE") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const userCompanyId = path.split("/")[5];
    return handleDeleteCompanyUser(env, userCompanyId, origin);
  }

  // Industries
  if (path === "/api/industries" && method === "GET") return handleGetAllIndustries(env, origin);

  // Company industries
  if (path.match(/^\/api\/companies\/[^/]+\/industries$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetCompanyIndustries(env, id, origin);
  }
  if (path.match(/^\/api\/companies\/[^/]+\/industries$/) && method === "PUT") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const id = path.split("/")[3];
    return handleSetCompanyIndustries(request, env, id, origin);
  }

  return null;
}
