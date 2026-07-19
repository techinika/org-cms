import {
  FeaturedStartup,
  UserCompany,
  Event,
  Opportunity,
  Application,
  EventRegistration,
  EventInvoice,
  EventTicket,
  EventSchedule,
  EventMetaDetails,
  Asset,
  Industry,
  Speaker,
} from "@/types/company";

const WORKER_API_URL = (process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8787").replace(/\/+$/, "");

export async function workerFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${WORKER_API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

async function workerGet<T>(path: string): Promise<{ data: T | null; error: Error | null }> {
  try {
    const res = await workerFetch(path);
    if (!res.ok) return { data: null, error: new Error(await res.text()) };
    const data = await res.json() as T;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

async function workerMutate<T>(path: string, method: string, body?: unknown): Promise<{ data: T | null; error: Error | null }> {
  try {
    const res = await workerFetch(path, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return { data: null, error: new Error(await res.text()) };
    const data = await res.json() as T;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

async function workerDelete(path: string): Promise<{ error: Error | null }> {
  try {
    const res = await workerFetch(path, { method: "DELETE" });
    if (!res.ok) return { error: new Error(await res.text()) };
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}

// ── Events ─────────────────────────────────────────────────

export async function getEventById(id: string): Promise<{ data: Event | null; error: Error | null }> {
  return workerGet<Event>(`/api/events/${id}`);
}

export async function getCompanyEvents(companyId: string): Promise<{ data: Event[]; error: Error | null }> {
  const res = await workerGet<Event[]>(`/api/companies/${companyId}/events`);
  return { data: res.data || [], error: res.error };
}

export async function getCompanyOpportunities(companyId: string): Promise<{ data: Opportunity[]; error: Error | null }> {
  const res = await workerGet<Opportunity[]>(`/api/companies/${companyId}/opportunities`);
  return { data: res.data || [], error: res.error };
}

// ── Opportunities ──────────────────────────────────────────

export async function getOpportunityById(id: string): Promise<{ data: Opportunity | null; error: Error | null }> {
  return workerGet<Opportunity>(`/api/opportunities/${id}`);
}

export async function getOpportunityApplications(
  oppId: string,
  page = 1,
  limit = 50,
  options?: { status?: string; search?: string }
): Promise<{ data: Application[]; total: number; error: Error | null }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (options?.status) params.set("status", options.status);
  if (options?.search) params.set("search", options.search);
  try {
    const res = await workerFetch(`/api/opportunities/${oppId}/applications?${params}`);
    if (!res.ok) return { data: [], total: 0, error: new Error(await res.text()) };
    const json = await res.json() as { data: Application[]; total: number };
    return { data: json.data || [], total: json.total || 0, error: null };
  } catch (e) {
    return { data: [], total: 0, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

// ── Companies ──────────────────────────────────────────────

export async function getCompanyBySlug(slug: string): Promise<{ data: FeaturedStartup | null; error: Error | null }> {
  return workerGet<FeaturedStartup>(`/api/companies/by-slug/${slug}`);
}

export async function getAllCompanies(): Promise<{ data: FeaturedStartup[]; error: Error | null }> {
  const res = await workerGet<FeaturedStartup[]>(`/api/companies`);
  return { data: res.data || [], error: res.error };
}

export async function searchCompanies(query: string): Promise<{ data: FeaturedStartup[]; error: Error | null }> {
  const res = await workerGet<FeaturedStartup[]>(`/api/companies/search?q=${encodeURIComponent(query)}`);
  return { data: res.data || [], error: res.error };
}

export async function updateCompany(id: string, updates: Partial<FeaturedStartup>): Promise<{ data: FeaturedStartup | null; error: Error | null }> {
  return workerMutate<FeaturedStartup>(`/api/companies/${id}`, "PATCH", updates);
}

export async function createCompany(data: Partial<FeaturedStartup>): Promise<{ data: FeaturedStartup | null; error: Error | null }> {
  return workerMutate<FeaturedStartup>(`/api/companies`, "POST", data);
}

export async function claimCompany(userId: string, companyId: string, addedBy: string): Promise<{ data: UserCompany | null; error: Error | null }> {
  return workerMutate<UserCompany>(`/api/companies/claim`, "POST", { user_id: userId, company_id: companyId, added_by: addedBy });
}

// ── User Companies ─────────────────────────────────────────

export async function getUserCompanies(userId: string): Promise<{ data: UserCompany[]; error: Error | null }> {
  const res = await workerGet<UserCompany[]>(`/api/users/${userId}/companies`);
  return { data: res.data || [], error: res.error };
}

export async function getUserPendingRequests(userId: string): Promise<{ data: UserCompany[]; error: Error | null }> {
  const res = await workerGet<UserCompany[]>(`/api/users/${userId}/pending-requests`);
  return { data: res.data || [], error: res.error };
}

export async function getUserPendingRequestByCompany(userId: string, companyId: string): Promise<{ data: UserCompany | null; error: Error | null }> {
  return workerGet<UserCompany>(`/api/users/${userId}/pending-request/${companyId}`);
}

export async function removeUserCompany(userId: string, companyId: string): Promise<{ error: Error | null }> {
  return workerDelete(`/api/users/${userId}/companies/${companyId}`);
}

// ── Company Users ──────────────────────────────────────────

export async function getCompanyUsers(companyId: string): Promise<{ data: UserCompany[]; error: Error | null }> {
  const res = await workerGet<UserCompany[]>(`/api/companies/${companyId}/users`);
  return { data: res.data || [], error: res.error };
}

export async function updateCompanyUser(userCompanyId: string, updates: { role?: string; status?: string }): Promise<{ data: UserCompany | null; error: Error | null }> {
  return workerMutate<UserCompany>(`/api/companies/_user/${userCompanyId}`, "PATCH", updates);
}

// ── Industries ─────────────────────────────────────────────

export async function getAllIndustries(): Promise<{ data: Industry[]; error: Error | null }> {
  const res = await workerGet<Industry[]>(`/api/industries`);
  return { data: res.data || [], error: res.error };
}

export async function getCompanyIndustries(companyId: string): Promise<{ data: string[]; error: Error | null }> {
  const res = await workerGet<string[]>(`/api/companies/${companyId}/industries`);
  return { data: res.data || [], error: res.error };
}

export async function setCompanyIndustries(companyId: string, industryIds: string[]): Promise<{ error: Error | null }> {
  try {
    const res = await workerFetch(`/api/companies/${companyId}/industries`, {
      method: "PUT",
      body: JSON.stringify({ industry_ids: industryIds }),
    });
    if (!res.ok) return { error: new Error(await res.text()) };
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}

// ── Assets ─────────────────────────────────────────────────

export async function getAssetById(id: string): Promise<{ data: Asset | null; error: Error | null }> {
  return workerGet<Asset>(`/api/assets/${id}`);
}

// ── Speakers ───────────────────────────────────────────────

export async function getAllSpeakers(): Promise<{ data: Speaker[]; error: Error | null }> {
  const res = await workerGet<Speaker[]>(`/api/speakers`);
  return { data: res.data || [], error: res.error };
}

// ── Event Schedules ────────────────────────────────────────

export async function getEventSchedules(eventId: string): Promise<{ data: EventSchedule[]; error: Error | null }> {
  const res = await workerGet<EventSchedule[]>(`/api/events/${eventId}/schedules`);
  return { data: res.data || [], error: res.error };
}

// ── Event Tickets ──────────────────────────────────────────

export async function getEventTickets(eventId: string): Promise<{ data: EventTicket[]; error: Error | null }> {
  const res = await workerGet<EventTicket[]>(`/api/events/${eventId}/tickets`);
  return { data: res.data || [], error: res.error };
}

// ── Event Meta Details ─────────────────────────────────────

export async function getEventMetaDetails(eventId: string): Promise<{ data: EventMetaDetails | null; error: Error | null }> {
  return workerGet<EventMetaDetails>(`/api/events/${eventId}/meta`);
}

// ── Event Invoices / Financials ────────────────────────────

export async function getEventInvoices(eventId: string): Promise<{ data: (EventInvoice & { registration: EventRegistration | null })[]; error: Error | null }> {
  const res = await workerGet<(EventInvoice & { registration: EventRegistration | null })[]>(`/api/events/${eventId}/invoices`);
  return { data: res.data || [], error: res.error };
}

export async function getEventFinancials(eventId: string): Promise<{
  total_revenue: number;
  pending: number;
  paid: number;
  refunded: number;
  invoice_count: number;
  error: Error | null;
}> {
  try {
    const res = await workerFetch(`/api/events/${eventId}/financials`);
    if (!res.ok) return { total_revenue: 0, pending: 0, paid: 0, refunded: 0, invoice_count: 0, error: new Error(await res.text()) };
    const data = await res.json();
    return { ...data, error: null };
  } catch (e) {
    return { total_revenue: 0, pending: 0, paid: 0, refunded: 0, invoice_count: 0, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
