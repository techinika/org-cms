import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Building2, Calendar, Briefcase } from "lucide-react";

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

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const company = await getCompany(slug);

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Company not found</p>
      </div>
    );
  }

  const tabs = [
    { name: "Profile", href: `/${slug}/profile`, icon: Building2 },
    { name: "Events", href: `/${slug}/events`, icon: Calendar },
    { name: "Opportunities", href: `/${slug}/opportunities`, icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-sm text-gray-500">{company.location || "No location"}</p>
            </div>
          </div>

          <nav className="mt-6 flex gap-1 -ml-2">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-[#3182ce] hover:bg-gray-50 rounded-xl transition-colors"
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <p className="text-gray-500 text-center">Select a tab to view details</p>
        </div>
      </main>
    </div>
  );
}