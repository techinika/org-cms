import { createClient } from "@supabase/supabase-js";
import { FeaturedStartup, UserCompany, Event, Opportunity } from "@/types/company";

const supabaseUrl = process.env.NEXT_PUBLIC_PROJECT_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_API_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCompanyBySlug(slug: string): Promise<{ data: FeaturedStartup | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("featured_startups")
    .select("*")
    .eq("slug", slug)
    .single();

  return { data, error };
}

export async function updateCompany(id: string, updates: Partial<FeaturedStartup>): Promise<{ data: FeaturedStartup | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("featured_startups")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function getCompanyEvents(companyId: string): Promise<{ data: Event[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", companyId)
    .order("start_date", { ascending: true });

  return { data: data || [], error };
}

export async function getCompanyOpportunities(companyId: string): Promise<{ data: Opportunity[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

export async function getUserCompanies(userId: string): Promise<{ data: UserCompany[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_company")
    .select(`
      *,
      company:featured_startups(*)
    `)
    .eq("user_id", userId);

  return { data: data || [], error };
}

export async function getAllCompanies(): Promise<{ data: FeaturedStartup[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("featured_startups")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

export async function searchCompanies(query: string): Promise<{ data: FeaturedStartup[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("featured_startups")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(10);

  return { data: data || [], error };
}

export async function claimCompany(userId: string, companyId: string, addedBy: string): Promise<{ data: UserCompany | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_company")
    .insert({
      user_id: userId,
      company_id: companyId,
      role: "manager",
      status: "confirmation_pending",
      added_by: addedBy,
    })
    .select()
    .single();

  if (error) return { data: null, error };

  await supabase
    .from("featured_startups")
    .update({ claimed: true })
    .eq("id", companyId);

  return { data, error: null };
}