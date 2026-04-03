import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Briefcase, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCompany(slug: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_PROJECT_URL!,
    process.env.NEXT_PUBLIC_API_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: () => {},
      },
    }
  );

  const { data } = await supabase
    .from("featured_startups")
    .select("*")
    .eq("slug", slug)
    .single();

  return data;
}

export default async function CompanyOpportunitiesPage({ params }: Props) {
  const { slug } = await params;
  const company = await getCompany(slug);

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#3182ce]/10 rounded-2xl flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-[#3182ce]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Opportunities</h2>
            <p className="text-gray-500 max-w-sm">
              Job openings, internships, and grants from {company.name} will appear here. This feature is coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}