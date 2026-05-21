import { createClient } from "@supabase/supabase-js";
import { FeaturedStartup, UserCompany, Event, Opportunity, Application, EventRegistration, EventTicket, EventSchedule, EventCompany, EventMetaDetails, ApplicationFeedback, Asset, Industry } from "@/types/company";

const supabaseUrl = process.env.NEXT_PUBLIC_PROJECT_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_API_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function deleteCompany(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("featured_startups").delete().eq("id", id);
  return { error };
}

export async function removeUserCompany(userId: string, companyId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("user_company").delete().eq("user_id", userId).eq("company_id", companyId);
  return { error };
}

export async function deleteEvent(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  return { error };
}

export async function deleteOpportunity(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  return { error };
}

export async function getOpportunityById(id: string): Promise<{ data: Opportunity | null; error: Error | null }> {
  const { data, error } = await supabase.from("opportunities").select("*").eq("id", id).single();
  return { data, error };
}

export async function updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<{ data: Opportunity | null; error: Error | null }> {
  const { data, error } = await supabase.from("opportunities").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  return { data, error };
}

export async function incrementOpportunityLinkClicks(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc("increment_external_link_clicks", { opp_id: id });
  return { error };
}

export async function getOpportunityApplications(oppId: string, page = 1, limit = 50): Promise<{ data: Application[]; total: number; error: Error | null }> {
  const offset = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from("applications")
    .select("*", { count: "exact" })
    .eq("opportunity_id", oppId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return { data: data || [], total: count || 0, error };
}

export async function getEventById(id: string): Promise<{ data: Event | null; error: Error | null }> {
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
  return { data, error };
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<{ data: Event | null; error: Error | null }> {
  const { data, error } = await supabase.from("events").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  return { data, error };
}

export async function getCompanyBySlug(slug: string): Promise<{ data: FeaturedStartup | null; error: Error | null }> {
  const { data, error } = await supabase.from("featured_startups").select("*").eq("slug", slug).single();
  return { data, error };
}

export async function updateCompany(id: string, updates: Partial<FeaturedStartup>): Promise<{ data: FeaturedStartup | null; error: Error | null }> {
  const validFields: Partial<FeaturedStartup> = {
    name: updates.name,
    description: updates.description,
    logo_url: updates.logo_url,
    image_ref: updates.image_ref,
    learn_more_links: updates.learn_more_links,
    email: updates.email,
    country: updates.country,
    website: updates.website,
    location: updates.location,
    industry: updates.industry,
    status: updates.status,
    tags: updates.tags,
    reviews_count: updates.reviews_count,
    avg_rating: updates.avg_rating,
    roles: updates.roles,
    is_featured: updates.is_featured,
    slug: updates.slug,
    claimed: updates.claimed,
  };
  const { data, error } = await supabase.from("featured_startups").update({ ...validFields, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  return { data, error };
}

export async function getCompanyEvents(companyId: string): Promise<{ data: Event[]; error: Error | null }> {
  const { data, error } = await supabase.from("events").select("*").eq("organizer_id", companyId).order("start_date", { ascending: true });
  return { data: data || [], error };
}

export async function getCompanyOpportunities(companyId: string): Promise<{ data: Opportunity[]; error: Error | null }> {
  const { data, error } = await supabase.from("opportunities").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function getUserCompanies(userId: string): Promise<{ data: UserCompany[]; error: Error | null }> {
  const { data, error } = await supabase.from("user_company").select(`*, company:featured_startups(*)`).eq("user_id", userId);
  return { data: data || [], error };
}

export async function getUserPendingRequests(userId: string): Promise<{ data: UserCompany[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_company")
    .select(`*, company:featured_startups(*)`)
    .eq("user_id", userId)
    .eq("status", "confirmation_pending");
  return { data: data || [], error };
}

export async function getUserPendingRequestByCompany(userId: string, companyId: string): Promise<{ data: UserCompany | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_company")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("status", "confirmation_pending")
    .single();
  return { data, error };
}

export async function getUserCompanyById(userId: string, companyId: string): Promise<{ data: UserCompany | null; error: Error | null }> {
  const { data, error } = await supabase.from("user_company").select(`*, company:featured_startups(*)`).eq("user_id", userId).eq("company_id", companyId).single();
  return { data, error };
}

export async function getAllCompanies(): Promise<{ data: FeaturedStartup[]; error: Error | null }> {
  const { data, error } = await supabase.from("featured_startups").select("*").order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function searchCompanies(query: string): Promise<{ data: FeaturedStartup[]; error: Error | null }> {
  const { data, error } = await supabase.from("featured_startups").select("*").ilike("name", `%${query}%`).limit(10);
  return { data: data || [], error };
}

export async function claimCompany(userId: string, companyId: string, addedBy: string): Promise<{ data: UserCompany | null; error: Error | null }> {
  const { data, error } = await supabase.from("user_company").insert({ user_id: userId, company_id: companyId, role: "manager", status: "confirmation_pending", added_by: addedBy }).select().single();
  if (error) return { data: null, error };
  await supabase.from("featured_startups").update({ claimed: true }).eq("id", companyId);
  return { data, error: null };
}

export async function getCompanyUsers(companyId: string): Promise<{ data: UserCompany[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_company")
    .select("*, author:authors!user_company_user_id_fkey1(id, name, image_ref)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return { data: data as UserCompany[] || [], error };
}

export async function addCompanyUser(companyId: string, userEmail: string, role: string, addedBy: string): Promise<{ data: UserCompany | null; error: Error | null }> {
  const { data: users, error: userError } = await supabase
    .from("authors")
    .select("id")
    .eq("email", userEmail)
    .single();
  
  if (userError || !users) {
    return { data: null, error: new Error("User not found with this email") };
  }

  const { data, error } = await supabase
    .from("user_company")
    .insert({
      company_id: companyId,
      user_id: users.id,
      role: role,
      status: "confirmation_pending",
      added_by: addedBy,
    })
    .select()
    .single();
  
  return { data, error };
}

export async function updateCompanyUser(userCompanyId: string, updates: { role?: string; status?: string }): Promise<{ data: UserCompany | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_company")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userCompanyId)
    .select()
    .single();
  
  return { data, error };
}

export async function deleteCompanyUser(userCompanyId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("user_company").delete().eq("id", userCompanyId);
  return { error };
}

export async function getEventSchedules(eventId: string): Promise<{ data: EventSchedule[]; error: Error | null }> {
  const { data, error } = await supabase.from("event_schedule").select("*").eq("event_id", eventId).order("day_index", { ascending: true }).order("order_index", { ascending: true });
  return { data: data || [], error };
}

export async function createEventSchedule(schedule: Partial<EventSchedule>): Promise<{ data: EventSchedule | null; error: Error | null }> {
  const { data, error } = await supabase.from("event_schedule").insert(schedule).select().single();
  return { data, error };
}

export async function updateEventSchedule(id: string, updates: Partial<EventSchedule>): Promise<{ data: EventSchedule | null; error: Error | null }> {
  const { data, error } = await supabase.from("event_schedule").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  return { data, error };
}

export async function deleteEventSchedule(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("event_schedule").delete().eq("id", id);
  return { error };
}

export async function getEventTickets(eventId: string): Promise<{ data: EventTicket[]; error: Error | null }> {
  const { data, error } = await supabase.from("event_tickets").select("*").eq("event_id", eventId).order("created_at", { ascending: true });
  return { data: data || [], error };
}

export async function createEventTicket(ticket: Partial<EventTicket>): Promise<{ data: EventTicket | null; error: Error | null }> {
  const { data, error } = await supabase.from("event_tickets").insert(ticket).select().single();
  return { data, error };
}

export async function updateEventTicket(id: string, updates: Partial<EventTicket>): Promise<{ data: EventTicket | null; error: Error | null }> {
  const { data, error } = await supabase.from("event_tickets").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  return { data, error };
}

export async function deleteEventTicket(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("event_tickets").delete().eq("id", id);
  return { error };
}

export async function updateEventRegistration(regId: string, updates: { status?: string; checked_in?: boolean }): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("event_registrations").update(updates).eq("id", regId);
  return { error };
}

export async function createAsset(asset: {
  url: string;
  name: string;
  type: string;
  author_id?: string | null;
}): Promise<{ data: Asset | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("assets")
    .insert(asset)
    .select()
    .single();
  return { data, error };
}

export async function getAssetById(id: string): Promise<{ data: Asset | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function getEventMetaDetails(eventId: string): Promise<{ data: EventMetaDetails | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("event_meta_details")
    .select("*")
    .eq("event_id", eventId)
    .single();
  return { data, error };
}

export async function upsertEventMetaDetails(meta: {
  event_id: string;
  is_free?: boolean;
  requires_approval?: boolean;
  capacity?: number | null;
  registration_open?: boolean;
}): Promise<{ data: EventMetaDetails | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("event_meta_details")
    .upsert({ ...meta, updated_at: new Date().toISOString() })
    .select()
    .single();
  return { data, error };
}

export async function updateApplicationFeedback(applicationId: string, status: string, message?: string, reviewerId?: string): Promise<{ data: ApplicationFeedback | null; error: Error | null }> {
  const { data: existing } = await supabase.from("applications_feedback").select("id").eq("application_id", applicationId).single();
  
  if (existing) {
    const { data, error } = await supabase.from("applications_feedback").update({ status, feedback_message: message, reviewer_id: reviewerId }).eq("id", existing.id).select().single();
    return { data, error };
  } else {
    const { data, error } = await supabase.from("applications_feedback").insert({ application_id: applicationId, status, feedback_message: message, reviewer_id: reviewerId }).select().single();
    return { data, error };
  }
}

export async function getApplicationFeedback(applicationId: string): Promise<{ data: ApplicationFeedback[]; error: Error | null }> {
  const { data, error } = await supabase.from("applications_feedback").select("*").eq("application_id", applicationId).order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function getAllIndustries(): Promise<{ data: Industry[]; error: Error | null }> {
  const { data, error } = await supabase.from("industries").select("*").order("name");
  return { data: data || [], error };
}

export async function getCompanyIndustries(companyId: string): Promise<{ data: string[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("company_industries")
    .select("industry:industries(*)")
    .eq("company_id", companyId);
  
  if (error) return { data: [], error };
  
  const industryIds = (data as any[])?.map((d: any) => d.industry?.id).filter(Boolean) as string[] || [];
  return { data: industryIds, error: null };
}

export async function setCompanyIndustries(companyId: string, industryIds: string[]): Promise<{ error: Error | null }> {
  await supabase.from("company_industries").delete().eq("company_id", companyId);
  
  if (industryIds.length === 0) return { error: null };
  
  const inserts = industryIds.map(industryId => ({
    company_id: companyId,
    industry_id: industryId,
  }));
  
  const { error } = await supabase.from("company_industries").insert(inserts);
  return { error };
}