import { createClient } from "@supabase/supabase-js";
import { FeaturedStartup, UserCompany, Event, Opportunity, Application, EventRegistration, EventTicket, EventSchedule, EventCompany, EventMetaDetails } from "@/types/company";

const supabaseUrl = process.env.NEXT_PUBLIC_PROJECT_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_API_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function deleteCompany(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("featured_startups").delete().eq("id", id);
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

export async function getOpportunityApplications(oppId: string): Promise<{ data: Application[]; error: Error | null }> {
  const { data, error } = await supabase.from("applications").select("*").eq("opportunity_id", oppId).order("created_at", { ascending: false });
  return { data: data || [], error };
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
  const { data, error } = await supabase.from("featured_startups").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
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