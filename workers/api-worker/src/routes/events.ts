import { Env } from "../env";
import { jsonResp, supabaseHeaders, supabaseGet, supabaseInsert, supabaseUpdate, supabaseDelete, supabaseCount } from "../supabase";
import { verifyAuth } from "../auth";

// ── Events CRUD ─────────────────────────────────────────────

export async function handleGetEventById(env: Env, eventId: string, origin: string | null) {
  const res = await supabaseGet(env, "events", `id=eq.${eventId}&limit=1`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0] || null, 200, origin);
}

export async function handleCreateEvent(request: Request, env: Env, origin: string | null) {
  const body = await request.json();
  const res = await supabaseInsert(env, "events", body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 201, origin);
}

export async function handleUpdateEvent(request: Request, env: Env, eventId: string, origin: string | null) {
  const body = await request.json() as Record<string, unknown>;
  const res = await supabaseUpdate(env, "events", `id=eq.${eventId}`, { ...body, updated_at: new Date().toISOString() });
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 200, origin);
}

export async function handleDeleteEvent(env: Env, eventId: string, origin: string | null) {
  const res = await supabaseDelete(env, "events", `id=eq.${eventId}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp({ success: true }, 200, origin);
}

// ── Event Schedule ──────────────────────────────────────────

export async function handleGetEventSchedules(env: Env, eventId: string, origin: string | null) {
  const res = await supabaseGet(env, "event_schedule", `event_id=eq.${eventId}&order=day_index.asc,order_index.asc`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleCreateEventSchedule(request: Request, env: Env, origin: string | null) {
  const body = await request.json();
  const res = await supabaseInsert(env, "event_schedule", body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 201, origin);
}

export async function handleUpdateEventSchedule(request: Request, env: Env, scheduleId: string, origin: string | null) {
  const body = await request.json() as Record<string, unknown>;
  const res = await supabaseUpdate(env, "event_schedule", `id=eq.${scheduleId}`, { ...body, updated_at: new Date().toISOString() });
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 200, origin);
}

export async function handleDeleteEventSchedule(env: Env, scheduleId: string, origin: string | null) {
  const res = await supabaseDelete(env, "event_schedule", `id=eq.${scheduleId}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp({ success: true }, 200, origin);
}

// ── Event Tickets ───────────────────────────────────────────

export async function handleGetEventTickets(env: Env, eventId: string, origin: string | null) {
  const res = await supabaseGet(env, "event_tickets", `event_id=eq.${eventId}&order=created_at.asc`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleCreateEventTicket(request: Request, env: Env, origin: string | null) {
  const body = await request.json();
  const res = await supabaseInsert(env, "event_tickets", body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 201, origin);
}

export async function handleUpdateEventTicket(request: Request, env: Env, ticketId: string, origin: string | null) {
  const body = await request.json() as Record<string, unknown>;
  const res = await supabaseUpdate(env, "event_tickets", `id=eq.${ticketId}`, { ...body, updated_at: new Date().toISOString() });
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 200, origin);
}

export async function handleDeleteEventTicket(env: Env, ticketId: string, origin: string | null) {
  const res = await supabaseDelete(env, "event_tickets", `id=eq.${ticketId}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp({ success: true }, 200, origin);
}

// ── Event Registrations ─────────────────────────────────────

export async function handleGetEventRegistrations(env: Env, eventId: string, origin: string | null) {
  const res = await supabaseGet(env, "event_registrations", `event_id=eq.${eventId}&order=created_at.desc&select=*,ticket:event_tickets(*)`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleCreateEventRegistration(request: Request, env: Env, origin: string | null) {
  const body = await request.json();
  const res = await supabaseInsert(env, "event_registrations", body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 201, origin);
}

export async function handleUpdateEventRegistration(request: Request, env: Env, regId: string, origin: string | null) {
  const body = await request.json();
  const res = await supabaseUpdate(env, "event_registrations", `id=eq.${regId}`, body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 200, origin);
}

// ── Event Meta Details ──────────────────────────────────────

export async function handleGetEventMetaDetails(env: Env, eventId: string, origin: string | null) {
  const res = await supabaseGet(env, "event_meta_details", `event_id=eq.${eventId}&limit=1`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0] || null, 200, origin);
}

export async function handleUpsertEventMetaDetails(request: Request, env: Env, origin: string | null) {
  const body = await request.json() as Record<string, unknown>;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/event_meta_details`, {
    method: "POST",
    headers: { ...supabaseHeaders(env), Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 200, origin);
}

// ── Event Speakers ──────────────────────────────────────────

export async function handleGetEventSpeakers(env: Env, eventId: string, origin: string | null) {
  const select = "*, speaker:speakers(*, company:featured_startups(*), asset:assets!image_ref(url))";
  const res = await supabaseGet(env, "event_speakers", `event_id=eq.${eventId}&order=speaking_order.asc&select=${encodeURIComponent(select)}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleAddEventSpeaker(request: Request, env: Env, origin: string | null) {
  const body = await request.json();
  const res = await supabaseInsert(env, "event_speakers", body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 201, origin);
}

export async function handleGetAllSpeakers(env: Env, origin: string | null) {
  const select = "*, company:featured_startups(*), asset:assets!image_ref(url)";
  const res = await supabaseGet(env, "speakers", `order=name&select=${encodeURIComponent(select)}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleCreateSpeaker(request: Request, env: Env, origin: string | null) {
  const body = await request.json();
  const res = await supabaseInsert(env, "speakers", body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 201, origin);
}

export async function handleUpdateSpeaker(request: Request, env: Env, speakerId: string, origin: string | null) {
  const body = await request.json();
  const res = await supabaseUpdate(env, "speakers", `id=eq.${speakerId}`, body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 200, origin);
}

export async function handleRemoveEventSpeaker(env: Env, eventId: string, speakerId: string, origin: string | null) {
  const res = await supabaseDelete(env, "event_speakers", `event_id=eq.${eventId}&speaker_id=eq.${speakerId}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp({ success: true }, 200, origin);
}

// ── Event Partners (event_companies) ────────────────────────

export async function handleGetEventPartners(env: Env, eventId: string, origin: string | null) {
  const select = "*, company:featured_startups(*)";
  const res = await supabaseGet(env, "event_companies", `event_id=eq.${eventId}&select=${encodeURIComponent(select)}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleAddEventPartner(request: Request, env: Env, origin: string | null) {
  const body = await request.json();
  const res = await supabaseInsert(env, "event_companies", body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 201, origin);
}

export async function handleUpdateEventPartner(request: Request, env: Env, partnerId: string, origin: string | null) {
  const body = await request.json();
  const res = await supabaseUpdate(env, "event_companies", `id=eq.${partnerId}`, body);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0], 200, origin);
}

export async function handleDeleteEventPartner(env: Env, partnerId: string, origin: string | null) {
  const res = await supabaseDelete(env, "event_companies", `id=eq.${partnerId}`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp({ success: true }, 200, origin);
}

// ── Event Invoices / Financials ─────────────────────────────

export async function handleGetEventInvoices(env: Env, eventId: string, origin: string | null) {
  const regRes = await supabaseGet(env, "event_registrations", `event_id=eq.${eventId}&select=id`);
  if (!regRes.ok) return jsonResp({ error: await regRes.text() }, 400, origin);
  const regs = await regRes.json() as { id: string }[];
  const regIds = regs.map(r => r.id);
  if (regIds.length === 0) return jsonResp([], 200, origin);

  const res = await supabaseGet(env, "event_invoices", `registration_id=in.(${regIds.join(",")})&order=created_at.desc&select=*,registration:event_registrations(*)`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  return jsonResp(await res.json(), 200, origin);
}

export async function handleGetEventFinancials(env: Env, eventId: string, origin: string | null) {
  const regRes = await supabaseGet(env, "event_registrations", `event_id=eq.${eventId}&select=id`);
  if (!regRes.ok) return jsonResp({ error: await regRes.text() }, 400, origin);
  const regs = await regRes.json() as { id: string }[];
  const regIds = regs.map(r => r.id);
  if (regIds.length === 0) return jsonResp({ total_revenue: 0, pending: 0, paid: 0, refunded: 0, invoice_count: 0 }, 200, origin);

  const res = await supabaseGet(env, "event_invoices", `registration_id=in.(${regIds.join(",")})&select=amount,currency,status`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const invoices = await res.json() as { amount: number; currency: string; status: string }[];

  return jsonResp({
    total_revenue: invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0),
    pending: invoices.filter(i => i.status === "pending").reduce((s, i) => s + Number(i.amount), 0),
    paid: invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0),
    refunded: invoices.filter(i => i.status === "refunded").reduce((s, i) => s + Number(i.amount), 0),
    invoice_count: invoices.length,
  }, 200, origin);
}

// ── Event Stats ─────────────────────────────────────────────

export async function handleGetEventStats(env: Env, eventId: string, origin: string | null) {
  const eventRes = await supabaseGet(env, "events", `id=eq.${eventId}&select=views`);
  if (!eventRes.ok) return jsonResp({ error: await eventRes.text() }, 400, origin);
  const events = await eventRes.json() as { views: number }[];

  const totalRegistrations = await supabaseCount(env, "event_registrations", `event_id=eq.${eventId}`);

  return jsonResp({ views: events[0]?.views || 0, total_registrations: totalRegistrations }, 200, origin);
}

// ── Router ──────────────────────────────────────────────────

export async function routeEvents(request: Request, env: Env, url: URL, origin: string | null): Promise<Response | null> {
  const method = request.method;
  const path = url.pathname;

  // Event CRUD
  if (path === "/api/events" && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    return handleCreateEvent(request, env, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetEventById(env, id, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+$/) && method === "PATCH") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const id = path.split("/")[3];
    return handleUpdateEvent(request, env, id, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+$/) && method === "DELETE") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const id = path.split("/")[3];
    return handleDeleteEvent(env, id, origin);
  }

  // Event schedules
  if (path.match(/^\/api\/events\/[^/]+\/schedules$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetEventSchedules(env, id, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/schedules$/) && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    return handleCreateEventSchedule(request, env, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/schedules\/[^/]+$/) && method === "PATCH") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const scheduleId = path.split("/")[5];
    return handleUpdateEventSchedule(request, env, scheduleId, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/schedules\/[^/]+$/) && method === "DELETE") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const scheduleId = path.split("/")[5];
    return handleDeleteEventSchedule(env, scheduleId, origin);
  }

  // Event tickets
  if (path.match(/^\/api\/events\/[^/]+\/tickets$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetEventTickets(env, id, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/tickets$/) && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    return handleCreateEventTicket(request, env, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/tickets\/[^/]+$/) && method === "PATCH") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const ticketId = path.split("/")[5];
    return handleUpdateEventTicket(request, env, ticketId, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/tickets\/[^/]+$/) && method === "DELETE") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const ticketId = path.split("/")[5];
    return handleDeleteEventTicket(env, ticketId, origin);
  }

  // Event registrations
  if (path.match(/^\/api\/events\/[^/]+\/registrations$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetEventRegistrations(env, id, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/registrations$/) && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    return handleCreateEventRegistration(request, env, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/registrations\/[^/]+$/) && method === "PATCH") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const regId = path.split("/")[5];
    return handleUpdateEventRegistration(request, env, regId, origin);
  }

  // Event meta details
  if (path.match(/^\/api\/events\/[^/]+\/meta$/) && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    return handleUpsertEventMetaDetails(request, env, origin);
  }

  // Event speakers
  if (path.match(/^\/api\/events\/[^/]+\/speakers$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetEventSpeakers(env, id, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/speakers$/) && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    return handleAddEventSpeaker(request, env, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/speakers\/[^/]+$/) && method === "DELETE") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const parts = path.split("/");
    return handleRemoveEventSpeaker(env, parts[3], parts[5], origin);
  }

  // Speaker CRUD (list/create/update)
  if (path === "/api/speakers" && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    return handleCreateSpeaker(request, env, origin);
  }
  if (path.match(/^\/api\/speakers\/[^/]+$/) && method === "PATCH") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const speakerId = path.split("/")[3];
    return handleUpdateSpeaker(request, env, speakerId, origin);
  }

  // Speaker CRUD (list/create/update)
  if (path === "/api/speakers" && method === "GET") return handleGetAllSpeakers(env, origin);
  if (path === "/api/speakers" && method === "POST") return handleCreateSpeaker(request, env, origin);
  if (path.match(/^\/api\/speakers\/[^/]+$/) && method === "PATCH") {
    const speakerId = path.split("/")[3];
    return handleUpdateSpeaker(request, env, speakerId, origin);
  }

  // Event partners
  if (path.match(/^\/api\/events\/[^/]+\/partners$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetEventPartners(env, id, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/partners$/) && method === "POST") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    return handleAddEventPartner(request, env, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/partners\/[^/]+$/) && method === "PATCH") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const partnerId = path.split("/")[5];
    return handleUpdateEventPartner(request, env, partnerId, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/partners\/[^/]+$/) && method === "DELETE") {
    if (!(await verifyAuth(request, env))) return jsonResp({ error: "Unauthorized" }, 401, origin);
    const partnerId = path.split("/")[5];
    return handleDeleteEventPartner(env, partnerId, origin);
  }

  // Event invoices/financials
  if (path.match(/^\/api\/events\/[^/]+\/invoices$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetEventInvoices(env, id, origin);
  }
  if (path.match(/^\/api\/events\/[^/]+\/financials$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetEventFinancials(env, id, origin);
  }

  // Event stats
  if (path.match(/^\/api\/events\/[^/]+\/stats$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetEventStats(env, id, origin);
  }

  return null;
}
